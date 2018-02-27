declare function connect(options: ConnectionOptions): Promise<any>;
declare function createSession(connection: any): Promise<any>;
declare function createSender(session: any, path: string, options?: any): Promise<any>;
declare function createReceiver(session: any, path: string, options?: any): Promise<any>;
export interface ParsedConnectionString {
    Endpoint: string;
    SharedAccessKeyName: string;
    SharedAccessKey: string;
    EntityPath?: string;
    [x: string]: any;
}
export interface ConnectionOptions {
    transport?: string;
    host: string;
    hostname: string;
    port: number;
    reconnect_limit?: number;
    username: string;
    password?: string;
}
declare function parseConnectionString(connectionString: string): ParsedConnectionString;
declare function fromConnectionString(connectionString: string, options?: {
    useSaslAnonymous?: false;
}): Promise<any>;
export { connect, createSession, createSender, createReceiver, fromConnectionString, parseConnectionString };
