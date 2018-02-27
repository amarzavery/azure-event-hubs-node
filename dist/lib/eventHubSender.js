"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
/**
 * Instantiates a new sender from the AMQP `Sender`. Used by `EventHubClient`.
 *
 * @param {any} sender - The amqp sender link.
 * @constructor
 */
class EventHubSender extends events_1.EventEmitter {
    constructor(sender) {
        super();
        this._sender = sender;
    }
    /**
     * Sends the given message, with the given options on this link
     *
     * @method send
     * @param {any} message                   Message to send.  Will be sent as UTF8-encoded JSON string.
     * @param {string} [partitionKey]       Partition key - sent as x-opt-partition-key, and will hash to a partition ID.
     *
     * @return {Promise}
     */
    send(message, partitionKey) {
        if (partitionKey) {
            if (!message.message_annotations)
                message.message_annotations = {};
            message.message_annotations['x-opt-partition-key'] = partitionKey;
        }
        return this._sender.send(message);
    }
    /**
     * "Unlink" this sender, closing the link and resolving when that operation is complete. Leaves the underlying connection/session open.
     *
     * @method close
     *
     * @return {Promise}
     */
    async close() {
        var self = this;
        return self._sender.detach().then(function () {
            self.removeAllListeners();
            self._sender = null;
        });
    }
    ;
}
exports.EventHubSender = EventHubSender;
//# sourceMappingURL=eventHubSender.js.map