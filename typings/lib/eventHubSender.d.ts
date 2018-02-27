/// <reference types="node" />
import { EventEmitter } from "events";
/**
 * Instantiates a new sender from the AMQP `Sender`. Used by `EventHubClient`.
 *
 * @param {any} sender - The amqp sender link.
 * @constructor
 */
export declare class EventHubSender extends EventEmitter {
    private _sender;
    constructor(sender: any);
    /**
     * Sends the given message, with the given options on this link
     *
     * @method send
     * @param {any} message                   Message to send.  Will be sent as UTF8-encoded JSON string.
     * @param {string} [partitionKey]       Partition key - sent as x-opt-partition-key, and will hash to a partition ID.
     *
     * @return {Promise}
     */
    send(message: any, partitionKey?: string): any;
    /**
     * "Unlink" this sender, closing the link and resolving when that operation is complete. Leaves the underlying connection/session open.
     *
     * @method close
     *
     * @return {Promise}
     */
    close(): Promise<void>;
}
