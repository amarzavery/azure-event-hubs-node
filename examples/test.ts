import { EventHubClient } from "../lib/index";

const str = "Endpoint=sb://testeh12.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=Ykhm3ZZV+SoGlW/EAYTo0lKYKJPHgSWb+Lp5jcaLCWg=";
const path = "test1";


async function main(): Promise<void> {
  const client = EventHubClient.fromConnectionString(str, path);
  const sender = await client.createSender();
  const receiver = await client.createReceiver("0");
  sender.send("Hey Amar!!");
  receiver.on("message", (eventData) => {
    console.log(eventData);
  });
}

main().catch((err) => {
  console.log("error: ", err);
})
