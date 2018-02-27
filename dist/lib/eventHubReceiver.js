"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const eventData_1 = require("./eventData");
/**
 * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
 *
 * @param {any} receiver - The amqp receiver link.
 * @constructor
 */
class EventHubReceiver extends events_1.EventEmitter {
    constructor(receiver) {
        super();
        const self = this;
        self._receiver = receiver;
        function onMessage(context) {
            var evData = eventData_1.EventData.fromAmqpMessage(context.message);
            self.emit('message', evData);
        }
        self.on('newListener', function (event) {
            if (event === 'message') {
                self._receiver.on('message', onMessage);
            }
        });
        self.on('removeListener', function (event) {
            if (event === 'message') {
                self._receiver.on('message', onMessage);
            }
        });
    }
    async close() {
        var self = this;
        return self._receiver.detach().then(function () {
            self.removeAllListeners();
            self._receiver = null;
        });
    }
}
exports.EventHubReceiver = EventHubReceiver;
//# sourceMappingURL=eventHubReceiver.js.map