export declare function connect(options: ConnectionOptions): Promise<any>;
export declare function createSession(connection: any): Promise<any>;
export declare function createSender(session: any, options?: SenderOptions): Promise<any>;
export declare function createReceiver(session: any, options?: ReceiverOptions): Promise<any>;
/**
 * Defines the common set of properties that are applicable for a connection, session and a link (sender, receiver).
 * @interface EntityOptions
 */
export interface EntityOptions {
    /**
     * @property {any} [desired_capabilities] Extension capabilities the sender can use if the receiver supports them.
     */
    desired_capabilities?: any;
    /**
     * @property {any} [offered_capabilities] Extension capabilities the sender supports.
     */
    offered_capabilities?: any;
    /**
     * @property {object} [properties] Properties of the entity (connection, session, link) contain a set of fields
     * intended to provide more information about the entity.
     */
    properties?: {
        [x: string]: any;
    };
}
/**
 * Defines the options that can be provided while creating a connection.
 * @interface ConnectionOptions
 * @extends EntityOptions
 */
export interface ConnectionOptions extends EntityOptions {
    /**
     * @property {string} username - The username.
     */
    username: string;
    /**
     * @property {string} host - The host to connect to.
     */
    host: string;
    /**
     * @property {string} hostname - The hostname to connect to.
     */
    hostname: string;
    /**
     * @property {number} port - The port number (5671 or 5672) at which to connect to.
     */
    port: number;
    /**
     * @property {string} [transport] - The transport option.
     */
    transport?: 'tls' | 'ssl' | 'tcp';
    /**
     * @property {string} [container_id] The id of the source container. If not provided then
     * this will a guid string.
     */
    container_id?: string;
    /**
     * @property {string} [id] A unqiue name for the connection. If not provided then this will be
     * a string in the following format: "connection-<counter>".
     */
    id?: string;
    /**
     * @property {boolean} [reconnect] if true (default), the library will automatically attempt to
     * reconnect if disconnected.
     * - if false, automatic reconnect will be disabled
     * - if it is a numeric value, it is interpreted as the delay between
     * reconnect attempts (in milliseconds)
     */
    reconnect?: boolean;
    /**
     * @property {number} [reconnect_limit] maximum number of reconnect attempts.
     * Applicable only when reconnect is true.
     */
    reconnect_limit?: number;
    /**
     * @property {number} [initial_reconnect_delay] - Time to wait in milliseconds before
     * attempting to reconnect. Applicable only when reconnect is true or a number is
     * provided for reconnect.
     */
    initial_reconnect_delay?: number;
    /**
     * @property {number} [max_reconnect_delay] - Maximum reconnect delay in milliseconds
     * before attempting to reconnect. Applicable only when reconnect is true.
     */
    max_reconnect_delay?: number;
    /**
     * @property {string} [password] - The secret key to be used while establishing the connection.
     */
    password?: string;
    /**
     * @property {number} [max_frame_size] The largest frame size that the sending peer
     * is able to accept on this connection. Default: 4294967295
     */
    max_frame_size?: number;
    /**
     * @property {number} [idle_time_out] The largest frame size that the sending
     * peer is able to accept on this connection.
     */
    idle_time_out?: number;
    /**
     * @property {number} [channel_max] The highest channel number that can be used on the connection.
     */
    channel_max?: number;
    /**
     * @property {string[]} [outgoing_locales] A list of the locales that the peer supports
     * for sending informational text.
     */
    outgoing_locales?: string[];
    /**
     * @property {string[]} [incoming_locales] A list of locales that the sending peer
     * permits for incoming informational text. This list is ordered in decreasing level of preference.
     */
    incoming_locales?: string[];
}
/**
 * Defines the common set of options that can be provided while creating a link (sender, receiver).
 * @interface LinkOptions
 * @extends EntityOptions
 */
export interface LinkOptions extends EntityOptions {
    /**
     * @property {string} [name] The name of the link.
     * This should be unique for the container.
     * If not specified a unqiue name is generated.
     */
    name?: string;
    /**
     * @property {number} [snd_settle_mode] it specifies the sender settle mode with following possibile values:
     * - 0 - "unsettled" - The sender will send all deliveries initially unsettled to the receiver.
     * - 1 - "settled" - The sender will send all deliveries settled to the receiver.
     * - 2 - "mixed" - (default) The sender MAY send a mixture of settled and unsettled deliveries to the receiver.
     */
    snd_settle_mode?: 0 | 1 | 2;
    /**
     * @property {number} [rcv_settle_mode] it specifies the receiver settle mode with following possibile values:
     * - 0 - "first" - The receiver will spontaneously settle all incoming transfers.
     * - 1 - "second" - The receiver will only settle after sending the disposition to the sender and receiving a
     * disposition indicating settlement of the delivery from the sender.
     */
    rcv_settle_mode?: 0 | 1;
    /**
     * @property {number} [max_message_size] The maximum message size supported by the link endpoint.
     */
    max_message_size?: number;
}
/**
 * Defines the options that can be provided while creating the source/target for a Sender or Receiver (link).
 * @interface TerminusOptions
 */
export interface TerminusOptions {
    /**
     * @property {string} [address] - The AMQP address as target for this terminus.
     */
    address: string;
    /**
     * @property {object} [filter] - The filters to be added for the terminus.
     */
    filter?: {
        [x: string]: any;
    };
    /**
     * @property {boolean} [durable] - It specifies a request for the receiving peer
     * to dynamically create a node at the target/source. Default: false.
     */
    dynamic?: boolean;
    /**
     * @property {string} [expiry_policy] - The expiry policy of the terminus. Default value "session-end".
     */
    expiry_policy?: string;
    /**
     * @property {number} [durable] It specifies what state of the terminus will be retained durably:
     *  - the state of durable messages (unsettled_state value),
     *  - only existence and configuration of the terminus (configuration value), or
     *  - no state at all (none value);
     */
    durable?: number;
}
/**
 * Defines the options that can be set while creating the Receiver (link).
 * @interface ReceiverOptions
 * @extends LinkOptions
 */
export interface ReceiverOptions extends LinkOptions {
    /**
     * @property {object} [prefetch]  A 'prefetch' window controlling the flow of messages over
     * this receiver. Defaults to 500 if not specified. A value of 0 can be used to
     * turn of automatic flow control and manage it directly.
     */
    prefetch?: number;
    /**
     * @property {boolean} [autoaccept] Whether received messages should be automatically accepted. Defaults to true.
     */
    autoaccept?: boolean;
    /**
     * @property {object} source  The source from which messages are received.
     */
    source: TerminusOptions;
    /**
     * @property {object} [target]  The target of a receiving link is the local identifier
     */
    target?: TerminusOptions;
}
/**
 * Defines the options that can be set while creating the Sender (link).
 * @interface SenderOptions
 * @extends LinkOptions
 */
export interface SenderOptions extends LinkOptions {
    /**
     * @property {boolean} [autosettle] Whether sent messages should be automatically settled once the peer settles them. Defaults to true.
     */
    autosettle?: boolean;
    /**
     * @property {object} target  - The target to which messages are sent
     */
    target: TerminusOptions;
    /**
     * @property {object} [source]  The source of a sending link is the local identifier
     */
    source?: TerminusOptions;
}