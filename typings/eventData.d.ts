export declare namespace EventData {
    interface Dictionary<T> {
        [key: string]: T;
    }
}
export declare class EventData {
    readonly body: any;
    readonly enqueuedTimeUtc?: Date | string | number;
    readonly partitionKey?: string | null;
    readonly offset?: string;
    readonly sequenceNumber?: number;
    readonly annotations?: EventData.Dictionary<any>;
    readonly systemProperties?: EventData.Dictionary<any>;
    properties?: EventData.Dictionary<any>;
    applicationProperties?: EventData.Dictionary<any>;
    constructor(body: any, annotations: EventData.Dictionary<any>, properties: EventData.Dictionary<any>, applicationProperties: EventData.Dictionary<any>);
    static fromAmqpMessage(msg: any): EventData;
}
