"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rhea_promise_1 = require("./rhea-promise");
class ConnectionConfig {
    constructor(connectionString, path) {
        this.connectionString = connectionString;
        const parsedCS = rhea_promise_1.parseConnectionString(connectionString);
        this.endpoint = parsedCS.Endpoint;
        this.host = (this.endpoint.match('sb://([^/]*)') || [])[1];
        if (!path && !parsedCS.EntityPath) {
            throw new Error(`Either provide "path" or the "connectionString": "${connectionString}", must contain EntityPath="<path-to-the-entity>".`);
        }
        this.entityPath = path || parsedCS.EntityPath;
        this.sharedAccessKeyName = parsedCS.SharedAccessKeyName;
        this.sharedAccessKey = parsedCS.SharedAccessKey;
    }
}
exports.ConnectionConfig = ConnectionConfig;
//# sourceMappingURL=connectionConfig.js.map