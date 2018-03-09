import { EventHubClient, EventData } from "../lib";

const connectionString = "SB_CONNECTION_STRING";
const entityPath = "ENTITY_PATH";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";


async function main(): Promise<void> {
  const client = EventHubClient.fromConnectionString(str, path);
  console.log("Created EH client from connection string");
  const sender = await client.createSender("0");
  console.log("Created Sender for partition 0.");
  const receiver = await client.createReceiver("0", { startAfterTime: Date.now() });
  console.log("Created Receiver for partition 0 and CG $default.");

  const messageCount = 5;
  let datas: EventData[] = [];
  for (let i = 0; i < messageCount; i++) {
    let obj: EventData = { body: `Hello foo ${i}` };
    datas.push(obj);
  }

  sender.sendBatch(datas, 'pk1234656')
  console.log("message sent");

  receiver.on("message", (eventData: any) => {
    console.log(">>> EventDataObject: ", eventData);
    console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
  });
}

main().catch((err) => {
  console.log("error: ", err);
});
