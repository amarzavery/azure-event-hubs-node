// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as os from "os";
import * as process from "process";
import * as debugModule from "debug";
import * as rheaPromise from "./rhea-promise";
import * as Constants from "./util/constants";
import { ApplicationTokenCredentials, DeviceTokenCredentials, UserTokenCredentials, MSITokenCredentials } from "ms-rest-azure";
import { EventHubReceiver, EventHubSender, ConnectionConfig } from ".";
import { TokenProvider } from "./auth/token";
import { SasTokenProvider } from "./auth/sas";
import { AadTokenProvider } from "./auth/aad";
import { ManagementClient, EventHubPartitionRuntimeInformation, EventHubRuntimeInformation } from "./managementClient";
import { CbsClient } from "./cbs";
import { defaultLock } from "./util/utils";
import EventPosition from "./eventPosition";
const debug = debugModule("azure:event-hubs:client");

export interface ReceiveOptions {
  /**
   * @property {object} [eventPosition] The starting event position at which to start receiving messages.
   * This is used to filter messages for the EventHub Receiver.
   */
  eventPosition?: EventPosition;
  /**
   * @property {string} [consumerGroup] The consumer group to which the receiver wants to connect to.
   * If not provided then it will be connected to "$default" consumer group.
   */
  consumerGroup?: string;
  /**
   * @property {number} [prefetchCount] The upper limit of events this receiver will actively receive
   * regardless of whether a receive operation is pending. Defaults to 500.
   */
  prefetchCount?: number;
  /**
   * @property {number} [epoch] The epoch value that this receiver is currently using for partition ownership.
   */
  epoch?: number;
  /**
   * @property {boolean} [enableReceiverRuntimeMetric] A value indicating whether the runtime metric of a receiver is enabled.
   */
  enableReceiverRuntimeMetric?: boolean;
}


/**
 * @class EventHubClient
 * Describes the EventHub client.
 */
export class EventHubClient {
  config: ConnectionConfig;
  tokenProvider: TokenProvider;
  connection?: any;
  connectionId?: string;
  userAgent: string = "/js-event-hubs";
  receivers: { [x: string]: EventHubReceiver };
  senders: { [x: string]: EventHubSender };
  private _managementClient: ManagementClient;
  private _cbsClient: CbsClient;

  /**
   * Instantiate a client pointing to the Event Hub given by this configuration.
   *
   * @constructor
   * @param {ConnectionConfig} config - The connection configuration to create the EventHub Client.
   * @param {TokenProvider} [tokenProvider] - The token provider that provides the token for authentication.
   * Default value: SasTokenProvider.
   */
  constructor(config: ConnectionConfig, tokenProvider?: TokenProvider) {
    ConnectionConfig.validate(config);
    this.config = config;
    if (!tokenProvider) {
      tokenProvider = new SasTokenProvider(config.endpoint, config.sharedAccessKeyName, config.sharedAccessKey);
    }
    this.tokenProvider = tokenProvider;
    this.userAgent = "/js-event-hubs";
    this._managementClient = new ManagementClient(this.config.entityPath as string);
    this._cbsClient = new CbsClient();
    this.senders = {};
    this.receivers = {};
  }

  /**
   * Closes the AMQP connection to the Event Hub for this client,
   * returning a promise that will be resolved when disconnection is completed.
   * @method close
   * @returns {Promise<any>}
   */
  async close(): Promise<any> {
    try {
      if (this.connection) {
        // Close all the senders.
        for (let sender of Object.values(this.senders)) {
          await sender.close();
        }
        // Close all the receivers.
        for (let receiver of Object.values(this.receivers)) {
          await receiver.close();
        }
        // Close the cbs session;
        await this._cbsClient.close();
        // Close the management session
        await this._managementClient.close();
        await this.connection.close();
        debug(`Closed the amqp connection "${this.connection.options.id}" on the client.`);
        this.connection = undefined;
      }
    } catch (err) {
      const msg = `An error occurred while closing the connection "${this.connection.options.id}": ${JSON.stringify(err)}`;
      debug(msg);
      return Promise.reject(msg);
    }
  }

  /**
   * Creates a sender to the given event hub, and optionally to a given partition.
   * @method createSender
   * @param {(string|number)} [partitionId] Partition ID to which it will send event data.
   * @returns {Promise<EventHubSender>}
   */
  async createSender(partitionId?: string | number): Promise<EventHubSender> {
    if (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number") {
      throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
    }
    try {
      let ehSender = new EventHubSender(this, partitionId);
      // Establish the amqp connection if it does not exist.
      await this._open();
      // Acquire the lock and establish a cbs session if it does not exist on the connection. Although node.js
      // is single threaded, we need a locking mechanism to ensure that a race condition does not happen while
      // creating a shared resource (in this case the cbs session, since we want to have exactly 1 cbs session
      // per connection).
      debug(`Acquiring lock: ${this._cbsClient.cbsLock} for creating the cbs session while creating the sender.`);
      await defaultLock.acquire(this._cbsClient.cbsLock, () => { return this._cbsClient.init(this.connection); });
      const tokenObject = await this.tokenProvider.getToken(ehSender.audience);
      debug(`[${this.connection.options.id}] EH Sender: calling negotiateClaim for audience "${ehSender.audience}"`);
      // Negotitate the CBS claim.
      await this._cbsClient.negotiateClaim(ehSender.audience, this.connection, tokenObject);
      // Initialize the sender.
      await ehSender.init();
      this.senders[ehSender.name!] = ehSender;
      return ehSender;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Creates a new receiver that will receive event data from the EventHub.
   * @method createReceiver
   * @param {string|number} partitionId                        Partition ID from which to receive.
   * @param {ReceiveOptions} [options]                         Options for how you'd like to connect.
   * @param {string} [options.consumerGroup]                   Consumer group from which to receive.
   * @param {number} [options.prefetchcount]                   The upper limit of events this receiver will
   * actively receive regardless of whether a receive operation is pending.
   * @param {boolean} [options.enableReceiverRuntimeMetric]    Provides the approximate receiver runtime information
   * for a logical partition of an Event Hub if the value is true. Default false.
   * @param {number} [options.epoch]                           The epoch value that this receiver is currently
   * using for partition ownership. A value of undefined means this receiver is not an epoch-based receiver.
   * @param {EventPosition} [options.eventPosition]            The position of EventData in the EventHub parition from
   * where the receiver should start receiving. Only one of offset, sequenceNumber, enqueuedTime, customFilter can be specified.
   * `EventPosition.withCustomFilter()` should be used if you want more fine-grained control of the filtering.
   * See https://github.com/Azure/amqpnetlite/wiki/Azure%20Service%20Bus%20Event%20Hubs for details.
   */
  async createReceiver(partitionId: string | number, options?: ReceiveOptions): Promise<EventHubReceiver> {
    if (!partitionId || (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number")) {
      throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
    }

    try {
      let ehReceiver = new EventHubReceiver(this, partitionId, options);
      // Establish the amqp connection if it does not exist.
      await this._open();
      // Acquire the lock and establish a cbs session if it does not exist on the connection.
      await defaultLock.acquire(this._cbsClient.cbsLock, () => { return this._cbsClient.init(this.connection); });
      const tokenObject = await this.tokenProvider.getToken(ehReceiver.audience);
      debug(`[${this.connection.options.id}] EH Sender: calling negotiateClaim for audience "${ehReceiver.audience}"`);
      // Negotitate the CBS claim.
      await this._cbsClient.negotiateClaim(ehReceiver.audience, this.connection, tokenObject);
      // Initialize the receiver.
      await ehReceiver.init();
      this.receivers[ehReceiver.name!] = ehReceiver;
      return ehReceiver;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Provides the eventhub runtime information.
   * @method getHubRuntimeInformation
   * @returns {Promise<EventHubRuntimeInformation>}
   */
  async getHubRuntimeInformation(): Promise<EventHubRuntimeInformation> {
    try {
      await this._open();
      return await this._managementClient.getHubRuntimeInformation(this.connection);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Provides an array of partitionIds.
   * @method getPartitionIds
   * @returns {Promise<Array<string>>}
   */
  async getPartitionIds(): Promise<Array<string>> {
    try {
      let runtimeInfo = await this.getHubRuntimeInformation();
      return runtimeInfo.partitionIds;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Provides information about the specified partition.
   * @method getPartitionInformation
   * @param {(string|number)} partitionId Partition ID for which partition information is required.
   */
  async getPartitionInformation(partitionId: string | number): Promise<EventHubPartitionRuntimeInformation> {
    try {
      await this._open();
      return await this._managementClient.getPartitionInformation(this.connection, partitionId);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Opens the AMQP connection to the Event Hub for this client, returning a promise
   * that will be resolved when the connection is completed.
   * @method open
   *
   * @param {boolean} [useSaslPlain] - True for using sasl plain mode for authentication, false otherwise.
   * @returns {Promise<void>}
   */
  private async _open(useSaslPlain?: boolean): Promise<void> {
    if (useSaslPlain && typeof useSaslPlain !== "boolean") {
      throw new Error("'useSaslPlain' must be of type 'boolean'.");
    }
    if (!this.connection) {
      const connectOptions: rheaPromise.ConnectionOptions = {
        transport: Constants.TLS,
        host: this.config.host,
        hostname: this.config.host,
        username: this.config.sharedAccessKeyName,
        port: 5671,
        reconnect_limit: 100,
        properties: {
          product: "MSJSClient",
          version: Constants.packageJsonInfo.version || "0.1.0",
          platform: `(${os.arch()}-${os.type()}-${os.release()})`,
          framework: `Node/${process.version}`,
          "user-agent": this.userAgent
        }
      };
      if (useSaslPlain) {
        connectOptions.password = this.config.sharedAccessKey;
      }
      debug(`Dialling the amqp connection with options.`, connectOptions);
      this.connection = await rheaPromise.connect(connectOptions);
      debug(`Successfully established the amqp connection "${this.connection.options.id}".`);
    }
  }

  /**
   * Creates an EventHub Client from connection string.
   * @method createFromConnectionString
   * @param {string} connectionString - Connection string of the form 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
   * @param {string} [path] - EventHub path of the form 'my-event-hub-name'
   * @param {TokenProvider} [tokenProvider] - An instance of the token provider that provides the token for authentication. Default value: SasTokenProvider.
   * @returns {EventHubClient} - An instance of the eventhub client.
   */
  static createFromConnectionString(connectionString: string, path?: string, tokenProvider?: TokenProvider): EventHubClient {
    if (!connectionString || (connectionString && typeof connectionString !== "string")) {
      throw new Error("'connectionString' is a required parameter and must be of type: 'string'.");
    }
    const config = ConnectionConfig.create(connectionString, path);

    if (!config.entityPath) {
      throw new Error(`Either the connectionString must have "EntityPath=<path-to-entity>" or you must provide "path", while creating the client`);
    }
    return new EventHubClient(config, tokenProvider);
  }

  /**
   * Creates an EventHub Client from AADTokenCredentials.
   * @method
   * @param {string} host - Fully qualified domain name for Event Hubs. Most likely, {yournamespace}.servicebus.windows.net
   * @param {string} entityPath - EventHub path of the form 'my-event-hub-name'
   * @param {TokenCredentials} credentials - The AAD Token credentials. It can be one of the following: ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials.
   */
  static createFromAadTokenCredentials(host: string, entityPath: string, credentials: ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials): EventHubClient {
    if (!host || (host && typeof host !== "string")) {
      throw new Error("'host' is a required parameter and must be of type: 'string'.");
    }

    if (!entityPath || (entityPath && typeof entityPath !== "string")) {
      throw new Error("'entityPath' is a required parameter and must be of type: 'string'.");
    }

    if (!credentials ||
      (credentials &&
        !(credentials instanceof ApplicationTokenCredentials ||
          credentials instanceof UserTokenCredentials ||
          credentials instanceof DeviceTokenCredentials ||
          credentials instanceof MSITokenCredentials))) {
      throw new Error("'credentials' is a required parameter and must be an instance of ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials.");
    }

    if (!host.endsWith("/")) host += "/";
    const connectionString = `Endpoint=sb://${host};SharedAccessKeyName=defaultKeyName;SharedAccessKey=defaultKeyValue`;
    const tokenProvider = new AadTokenProvider(credentials);
    return EventHubClient.createFromConnectionString(connectionString, entityPath, tokenProvider);
  }
}
