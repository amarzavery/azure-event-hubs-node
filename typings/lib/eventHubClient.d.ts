import { EventHubReceiver, EventHubSender, ConnectionConfig } from ".";
interface ReceiveOptions {
    startAfterTime?: Date | number;
    startAfterOffset?: string;
    customFilter?: string;
}
interface EventHubRuntimeInformation {
    /**
     * @property {string} path - The name of the event hub.
     */
    path: string;
    /**
     * @property {Date} createdAt - The date and time the hub was created in UTC.
     */
    createdAt: Date;
    /**
     * @property {number} partitionCount - The number of partitions in the event hub.
     */
    partitionCount: number;
    /**
     * @property {string[]} partitionIds - The slice of string partition identifiers.
     */
    partitionIds: string[];
    /**
     * @property {string} type - The type of entity.
     */
    type: "com.microsoft:eventhub";
}
interface EventHubPartitionRuntimeInformation {
    /**
     * @property {string} hubPath - The name of the eventhub.
     */
    hubPath: string;
    /**
     * @property {string} partitionId - Identifier of the partition within the eventhub.
     */
    partitionId: string;
    /**
     * @property {number} beginningSequenceNumber - The starting sequence number of the partition's message log.
     */
    beginningSequenceNumber: number;
    /**
     * @property {number} lastSequenceNumber - The last sequence number of the partition's message log.
     */
    lastSequenceNumber: number;
    /**
     * @property {number} lastEnqueuedOffset - The offset of the last enqueued message in the partition's message log.
     */
    lastEnqueuedOffset: number;
    /**
     * @property {Date} lastEnqueuedTimeUtc - The time of the last enqueued message in the partition's message log in UTC.
     */
    lastEnqueuedTimeUtc: Date;
    /**
     * @property {string} type - The type of entity.
     */
    type: "com.microsoft:partition";
}
/**
 * Instantiate a client pointing to the Event Hub given by this configuration.
 *
 * @param {ConnectionConfig} config
 * @constructor
 */
declare class EventHubClient {
    private _config;
    connection: any;
    constructor(config: ConnectionConfig);
    /**
     * Creates an EventHub Client from connection string.
     * @method fromConnectionString
     * @param {string} connectionString - Connection string of the form 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {string} [path] - Event Hub path of the form 'my-event-hub-name'
     */
    static fromConnectionString(connectionString: string, path?: string): EventHubClient;
    /**
     * Opens the AMQP connection to the Event Hub for this client, returning a promise that will be resolved when the connection is completed.
     * @method open
     * @returns {Promise}
     */
    open(useSaslAnonymous?: boolean): Promise<any>;
    /**
     * Closes the AMQP connection to the Event Hub for this client, returning a promise that will be resolved when disconnection is completed.
     * @method close
     * @returns {Promise}
     */
    close(): Promise<any>;
    /**
     * @private
     * Helper method to make the management request
     * @param {string} type - The type of entity requested for. Valid values are "eventhub", "partition"
     * @param {string} [partitionId] - The partitionId. Required only when type is "partition".
     */
    private makeManagementRequest(type, partitionId?);
    /**
     * Provides the eventhub runtime information.
     * @method getHubRuntimeInformation
     * @returns {Promise<EventHubRuntimeInformation>}
     */
    getHubRuntimeInformation(): Promise<EventHubRuntimeInformation>;
    /**
     * Provides an array of partitionIds
     */
    getPartitionIds(): Promise<Array<string>>;
    /**
     *
     * @param partitionId
     */
    getPartitionInformation(partitionId: string): Promise<EventHubPartitionRuntimeInformation>;
    /**
     * Creates a sender to the given event hub, and optionally to a given partition.
     * @param {string} [partitionId] Partition ID to which it will send messages.
     * @returns {Promise<EventHubSender>}
     */
    createSender(partitionId?: string): Promise<EventHubSender>;
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
    createReceiver(partitionId: string | number, consumerGroup?: string, options?: ReceiveOptions): Promise<EventHubReceiver>;
}
export { ReceiveOptions, EventHubRuntimeInformation, EventHubPartitionRuntimeInformation, EventHubClient };
