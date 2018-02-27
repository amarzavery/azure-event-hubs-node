"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionConfig_1 = require("./connectionConfig");
const rheaPromise = require("./rhea-promise");
const rhea = require("rhea");
const uuid = require("uuid");
/**
 * Instantiate a client pointing to the Event Hub given by this configuration.
 *
 * @param {ConnectionConfig} config
 * @constructor
 */
class EventHubClient {
    constructor(config) {
        this._config = config;
    }
    /**
     * Creates an EventHub Client from connection string.
     * @method fromConnectionString
     * @param {string} connectionString - Connection string of the form 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {string} [path] - Event Hub path of the form 'my-event-hub-name'
     */
    static fromConnectionString(connectionString, path) {
        const config = new connectionConfig_1.ConnectionConfig(connectionString, path);
        if (!config.entityPath) {
            throw new Error(`Either the connectionString must have "EntityPath=<path-to-entity>" or you must provide "path", while creating the client`);
        }
        return new EventHubClient(config);
    }
    /**
     * Opens the AMQP connection to the Event Hub for this client, returning a promise that will be resolved when the connection is completed.
     * @method open
     * @returns {Promise}
     */
    async open(useSaslAnonymous = false) {
        if (!this.connection) {
            const connectOptions = {
                transport: 'tls',
                host: this._config.host,
                hostname: this._config.host,
                username: this._config.sharedAccessKeyName,
                port: 5671,
                reconnect_limit: 100
            };
            if (!useSaslAnonymous) {
                connectOptions.password = this._config.sharedAccessKey;
            }
            this.connection = rheaPromise.connect(connectOptions);
        }
        return Promise.resolve(this.connection);
    }
    /**
     * Closes the AMQP connection to the Event Hub for this client, returning a promise that will be resolved when disconnection is completed.
     * @method close
     * @returns {Promise}
     */
    close() {
        return this.connection.close();
    }
    /**
     * @private
     * Helper method to make the management request
     * @param {string} type - The type of entity requested for. Valid values are "eventhub", "partition"
     * @param {string} [partitionId] - The partitionId. Required only when type is "partition".
     */
    async makeManagementRequest(type, partitionId) {
        const self = this;
        return new Promise(async function (resolve, reject) {
            const endpoint = '$management';
            const replyTo = uuid.v4();
            const request = {
                body: Buffer.from(JSON.stringify([])),
                properties: {
                    message_id: uuid.v4(),
                    reply_to: replyTo
                },
                application_properties: {
                    operation: "READ",
                    name: self._config.entityPath,
                    type: `com.microsoft:${type}`
                }
            };
            if (partitionId && type === "partition") {
                request.application_properties.partition = partitionId;
            }
            const rxopt = { name: replyTo, target: { address: replyTo } };
            const connection = self.open();
            const session = await rheaPromise.createSession(connection);
            const [sender, receiver] = await Promise.all([
                rheaPromise.createSender(session, endpoint, {}),
                rheaPromise.createReceiver(session, endpoint, rxopt)
            ]);
            receiver.on('message', ({ message, delivery }) => {
                const code = message.application_properties['status-code'];
                const desc = message.application_properties['status-description'];
                if (code === 200) {
                    return resolve(message.body);
                }
                else if (code === 404) {
                    return reject(desc);
                }
            });
            return sender.send(request);
        }.bind(self));
    }
    /**
     * Provides the eventhub runtime information.
     * @method getHubRuntimeInformation
     * @returns {Promise<EventHubRuntimeInformation>}
     */
    async getHubRuntimeInformation() {
        const self = this;
        const info = await this.makeManagementRequest("eventhub");
        const runtimeInfo = {
            path: info.name,
            createdAt: new Date(info.created_at),
            partitionCount: info.partition_count,
            partitionIds: info.partition_ids,
            type: info.type
        };
        return Promise.resolve(runtimeInfo);
    }
    /**
     * Provides an array of partitionIds
     */
    async getPartitionIds() {
        let runtimeInfo = await this.getHubRuntimeInformation();
        return runtimeInfo.partitionIds;
    }
    /**
     *
     * @param partitionId
     */
    async getPartitionInformation(partitionId) {
        const self = this;
        const info = await this.makeManagementRequest("partition", partitionId);
        const partitionInfo = {
            beginningSequenceNumber: info.begin_sequence_number,
            hubPath: info.name,
            lastEnqueuedOffset: info.last_enqueued_offset,
            lastEnqueuedTimeUtc: info.last_enqueued_time_utc,
            lastSequenceNumber: info.last_enqueued_sequence_number,
            partitionId: info.partition,
            type: info.type
        };
        return Promise.resolve(partitionInfo);
    }
    /**
     * Creates a sender to the given event hub, and optionally to a given partition.
     * @param {string} [partitionId] Partition ID to which it will send messages.
     * @returns {Promise<EventHubSender>}
     */
    async createSender(partitionId) {
        let connection = await this.open();
        let senderSession = await rheaPromise.createSession(connection);
        let sender = await rheaPromise.createSender(senderSession, this._config.entityPath);
        return Promise.resolve(sender);
    }
    /**
     * Creates a receiver for the given event hub, consumer group, and partition.
     * Receivers are event emitters, watch for 'message' event.
     *
     * @method createReceiver
     * @param {(string | number)} partitionId               Partition ID from which to receive.
     * @param {string} [consumerGroup]                    Consumer group from which to receive.
     * @param {ReceiveOptions} [options]                               Options for how you'd like to connect. Only one can be specified.
     * @param {(Date|Number)} options.startAfterTime      Only receive messages enqueued after the given time.
     * @param {string} options.startAfterOffset           Only receive messages after the given offset.
     * @param {string} options.customFilter               If you want more fine-grained control of the filtering.
     *      See https://github.com/Azure/amqpnetlite/wiki/Azure%20Service%20Bus%20Event%20Hubs for details.
     *
     * @return {Promise<EventHubReceiver>}
     */
    async createReceiver(partitionId, consumerGroup = "$default", options) {
        const receiverAddress = `${this._config.entityPath}/ConsumerGroups/${consumerGroup}/Partitions/${partitionId}`;
        let rcvrOptions = {
            autoaccept: false
        };
        if (options) {
            let filterClause = null;
            if (options.startAfterTime) {
                let time = (options.startAfterTime instanceof Date) ? options.startAfterTime.getTime() : options.startAfterTime;
                filterClause = `amqp.annotation.x-opt-enqueued-time > "${time}"`;
            }
            else if (options.startAfterOffset) {
                filterClause = `amqp.annotation.x-opt-offset > "${options.startAfterOffset}"`;
            }
            else if (options.customFilter) {
                filterClause = options.customFilter;
            }
            if (filterClause) {
                rcvrOptions.filter = {
                    'apache.org:selector-filter:string': rhea.types.wrap_described(filterClause, 0x468C00000004)
                };
            }
        }
        let connection = await this.open();
        let receiverSession = await rheaPromise.createSession(connection);
        let receiver = await rheaPromise.createReceiver(receiverSession, receiverAddress, rcvrOptions);
        return Promise.resolve(receiver);
    }
}
exports.EventHubClient = EventHubClient;
//# sourceMappingURL=eventHubClient.js.map