import { EventHubClient } from "../lib";
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
async function main(): Promise<void> {
  const client = EventHubClient.createFromConnectionString(str, path);
  const receiver = await client.createReceiver("0", { enableReceiverRuntimeMetric: true });
  console.log("Created Receiver for partition 0 and CG $default.");
  for await (let d of receiver.receiveIterable()) {
    console.log("Eventdata>>>>>>>> ", d);
  }
  console.log("Creating receiver 2......");
  const receiver2 = await client.createReceiver("0", { epoch: 2 });
  receiver2.on("message", (eventData: any) => {
    console.log("@@@@ receiver 2: ", receiver.name);
    console.log(">>> EventDataObject: ", eventData);
    console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
  });
}
main().catch((err) => {
  console.log("error: ", err);
});
