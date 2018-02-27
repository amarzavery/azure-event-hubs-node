/// <reference types="node" />
import { EventEmitter } from "events";
/**
 * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
 *
 * @param {any} receiver - The amqp receiver link.
 * @constructor
 */
export declare class EventHubReceiver extends EventEmitter {
    private _receiver;
    constructor(receiver: any);
    close(): Promise<any>;
}
