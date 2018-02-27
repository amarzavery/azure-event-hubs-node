export declare class ConnectionConfig {
    endpoint: string;
    host: string;
    connectionString: string;
    entityPath?: string;
    sharedAccessKeyName: string;
    sharedAccessKey: string;
    constructor(connectionString: string, path?: string);
}
