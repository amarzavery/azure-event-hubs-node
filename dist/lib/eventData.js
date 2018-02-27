"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EventData {
    constructor(body, annotations, properties, applicationProperties) {
        this.body = body;
        this.annotations = annotations;
        this.properties = properties;
        this.systemProperties = properties;
        this.applicationProperties = applicationProperties;
        if (this.annotations) {
            this.partitionKey = this.annotations["x-opt-partition-key"];
            this.sequenceNumber = this.annotations["x-opt-sequence-number"];
            this.enqueuedTimeUtc = this.annotations["x-opt-enqueued-time"];
            this.offset = this.annotations["x-opt-offset"];
        }
    }
    static fromAmqpMessage(msg) {
        return new EventData(msg.body, msg.message_annotations, msg.properties, msg.application_properties);
    }
}
exports.EventData = EventData;
//# sourceMappingURL=eventData.js.map