const child_process = require('child_process');
const fs = require("fs");
const path = require("path");

const args = [
  "dist/testhub/cli.js",
  "receive",
  "-c",
  "Endpoint=sb://eastusjs.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=DYzqQdL2pLF9CHrzTdMdWGBX5PCon/1LDcvHJqdWvMk=",
  "-n", "test1", "-p", "0"

];
const options = {
  cwd: "/Users/amarz/sdk/rh/final/azure-event-hubs-node/testhub",
  env: {
    "DEBUG": "azure*,rhea*"
  }
}
var out = fs.openSync(path.join(__dirname, `stdout-${Date.now()}.log`), 'w');
var derr = fs.openSync(path.join(__dirname, `stderr-${Date.now()}.log`), 'w');
fs.writeSync(out, 'Test run started at ' + new Date().toISOString() + '\n');
const child = child_process.spawn('node', args);

child.stdout.on("data", (data) => {
  fs.writeSync(out, data.toString('UTF-8'));
});

child.stderr.on('data', (data) => {
  const dataString = data.toString();
  fs.writeSync(derr, dataString);
});