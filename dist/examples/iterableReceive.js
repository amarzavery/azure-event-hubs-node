"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator];
    return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
// import fromEmitter from "@async-generators/from-emitter";
const connectionString = "EVENTHUB_CONNECTION_STRING";
const entityPath = "EVENTHUB_NAME";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";
// async function main(): Promise<void> {
//   const client = EventHubClient.createFromConnectionString(str, path);
//   const receiver = await client.createReceiver("0", { enableReceiverRuntimeMetric: true });
//   console.log("Created Receiver for partition 0 and CG $default.");
//   let source = fromEmitter(receiver, { onNext: "message", onError: "error" });
//   let consumer = new Promise(async done => {
//     for await (let item of source) {
//       console.log(">>> EventDataObject: ", item);
//     }
//     done();
//   });
//   // consumer.catch((err) => {
//   //   console.log("???????????? Caught Error, ", err);
//   // });
//   console.log(consumer);
//   // await consumer;
//   const receiver2 = await client.createReceiver("0", { epoch: 2 });
//   receiver2.on("message", (eventData: any) => {
//     console.log("@@@@ receiver 2: ", receiver.name);
//     console.log(">>> EventDataObject: ", eventData);
//     console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
//   });
// }
async function main() {
    const client = lib_1.EventHubClient.createFromConnectionString(str, path);
    const receiver = await client.createReceiver("0", { enableReceiverRuntimeMetric: true });
    console.log("Created Receiver for partition 0 and CG $default.");
    try {
        for (var _a = __asyncValues(receiver.receiveIterable()), _b; _b = await _a.next(), !_b.done;) {
            let d = await _b.value;
            console.log("Eventdata>>>>>>>> ", d);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_b && !_b.done && (_c = _a.return)) await _c.call(_a);
        }
        finally { if (e_1) throw e_1.error; }
    }
    console.log("Creating receiver 2......");
    const receiver2 = await client.createReceiver("0", { epoch: 2 });
    receiver2.on("message", (eventData) => {
        console.log("@@@@ receiver 2: ", receiver.name);
        console.log(">>> EventDataObject: ", eventData);
        console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
    });
    var e_1, _c;
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=iterableReceive.js.map