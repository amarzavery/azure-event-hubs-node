import { EventHubClient, EventPosition, OnMessage, OnError, EventHubsError, delay, EventData } from "../lib";
import * as rhea from "rhea";

const connectionString = "EVENTHUB_CONNECTION_STRING";
const entityPath = "EVENTHUB_NAME";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";
let client: EventHubClient;
async function main(): Promise<void> {
  client = EventHubClient.createFromConnectionString(str, path);
  const ids = ["0", "1"]; // await client.getPartitionIds();
  // const hub = await client.getHubRuntimeInformation();
  // console.log(">>>> Hub: \n", hub);
  for (let i = 0; i < ids.length; i++) {
    const onMessage: OnMessage = async (eventData: any) => {
      console.log(">>> EventDataObject: ", eventData);
      console.log("### Actual message:", tryConvertEventDataBodyToString(eventData));
    }
    const onError: OnError = (err: EventHubsError | Error) => {
      console.log(">>>>> Error occurred: ", err);
    };
    //console.log(onMessage, onError);
    client.receive(ids[i], onMessage, onError, { consumerGroup: "cg1", eventPosition: EventPosition.fromEnqueuedTime(Date.now()) });
    // giving some time for receiver setup to complete. This will make sure that the receiver can receive the newly sent
    // message from now onwards.
    await delay(3000);
    console.log("***********Created receiver %d", i);
    const object = {
      "id": "7a63aaa394c74c1182308f19d4c4cb79",
      "name": "John" + new Date().toString(),
      "data": "{}",
      "version": 1
    };
    await client.send({ body: rhea.message.data_section(Buffer.from(JSON.stringify(object), "utf8")) }, ids[i]);
    console.log("***********Created sender %d and sent the message...", i);
    // Giving enough time for the receiver to receive the message...
    await delay(6000);
    //await rcvrHandler.stop();
  }
}

main().then(() => {
  return client.close();
}).catch((err) => {
  console.log("error: ", err);
});

function tryConvertEventDataBodyToString(eventData: EventData): any {
  let result: any;
  if (eventData) {
    if (typeof eventData.body === "string")
      result = eventData.body;
    else if (eventData.body.content)
      result = eventData.body.content.toString("utf8");
    else if (Buffer.isBuffer(eventData.body))
      result = eventData.body.toString("utf8");
  }
  console.log("The stringified body is: ", result);
  return result;
}