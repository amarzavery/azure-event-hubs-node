"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rhea = require("rhea");
const url = require("url");
async function connect(options) {
    return new Promise((resolve, reject) => {
        const connection = rhea.connect(options);
        function onOpen(context) {
            connection.removeListener('connection_open', onOpen);
            connection.removeListener('connection_close', onClose);
            connection.removeListener('disconnected', onClose);
            resolve(connection);
        }
        function onClose(err) {
            connection.removeListener('connection_open', onOpen);
            connection.removeListener('connection_close', onClose);
            connection.removeListener('disconnected', onClose);
            reject(err);
        }
        connection.once('connection_open', onOpen);
        connection.once('connection_close', onClose);
        connection.once('disconnected', onClose);
    });
}
exports.connect = connect;
async function createSession(connection) {
    return new Promise((resolve, reject) => {
        const session = connection.create_session();
        function onOpen(context) {
            session.removeListener('session_open', onOpen);
            session.removeListener('session_close', onClose);
            resolve(session);
        }
        function onClose(err) {
            session.removeListener('session_open', onOpen);
            session.removeListener('session_close', onClose);
            reject(err);
        }
        session.once('session_open', onOpen);
        session.once('session_close', onClose);
        session.begin();
    });
}
exports.createSession = createSession;
async function createSender(session, path, options) {
    if (!options)
        options = {};
    if (!options.target)
        options.target = {};
    options.target.address = path;
    return new Promise((resolve, reject) => {
        const sender = session.attach_sender(path, options);
        function onOpen(context) {
            sender.removeListener('sendable', onOpen);
            sender.removeListener('sender_close', onClose);
            resolve(sender);
        }
        function onClose(err) {
            sender.removeListener('sendable', onOpen);
            sender.removeListener('sender_close', onClose);
            reject(err);
        }
        sender.once('sendable', onOpen);
        sender.once('sender_close', onClose);
    });
}
exports.createSender = createSender;
async function createReceiver(session, path, options) {
    if (!options)
        options = {};
    if (!options.source)
        options.source = {};
    options.source.address = path;
    return new Promise((resolve, reject) => {
        const receiver = session.attach_receiver(options);
        function onOpen(context) {
            receiver.removeListener('receiver_open', onOpen);
            receiver.removeListener('receiver_close', onClose);
            resolve(receiver);
        }
        function onClose(err) {
            receiver.removeListener('receiver_open', onOpen);
            receiver.removeListener('receiver_close', onClose);
            reject(err);
        }
        receiver.once('receiver_open', onOpen);
        receiver.once('receiver_close', onClose);
    });
}
exports.createReceiver = createReceiver;
function parseConnectionString(connectionString) {
    return connectionString.split(';').reduce((acc, part) => {
        const splitIndex = part.indexOf('=');
        return Object.assign({}, acc, { [part.substring(0, splitIndex)]: part.substring(splitIndex + 1) });
    }, {});
}
exports.parseConnectionString = parseConnectionString;
async function fromConnectionString(connectionString, options) {
    if (!options)
        options = {};
    const parsed = parseConnectionString(connectionString);
    const connectOptions = {
        transport: 'tls',
        host: url.parse(parsed.Endpoint).hostname,
        hostname: url.parse(parsed.Endpoint).hostname,
        username: parsed.SharedAccessKeyName,
        port: 5671,
        reconnect_limit: 100
    };
    if (!options.useSaslAnonymous) {
        connectOptions.password = parsed.SharedAccessKey;
    }
    return await connect(connectOptions);
}
exports.fromConnectionString = fromConnectionString;
//# sourceMappingURL=index.js.map