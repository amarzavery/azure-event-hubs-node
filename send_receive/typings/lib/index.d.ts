export { EventData } from "./eventData";
export { ConnectionConfig } from "./connectionConfig";
export { EventHubReceiver } from "./eventHubReceiver";
export { EventHubSender } from "./eventHubSender";
export { EventHubClient, EventHubPartitionRuntimeInformation, EventHubRuntimeInformation, ReceiveOptions } from "./eventHubClient";
export { TokenType, TokenProvider, TokenInfo } from "./auth/token";
export import EventHubManagementClient = require("azure-arm-eventhub");
import * as EventHubManagementModels from "azure-arm-eventhub/lib/models";
export { EventHubManagementModels };