"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../lib/index");
const str = process.env["SB_CONNECTION_STRING"] || "";
const path = process.env["ENTITY_PATH"] || "";
async function main() {
    const client = index_1.EventHubClient.fromConnectionString(str, path);
    const sender = await client.createSender();
    const receiver = await client.createReceiver("0");
    sender.send("Hey Amar!!");
    receiver.on("message", (eventData) => {
        console.log(eventData);
    });
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=test.js.map