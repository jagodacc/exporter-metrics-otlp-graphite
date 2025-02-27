export type CarbonClientOptions = {
    protocol: 'plaintext';
    host: string;
    /**
     * Graphite server port
     * @default 2003
     */
    port?: number;
    /**
     * Keep the connection alive
     * @default true
     */
    keepAlive?: boolean;
    /**
     * Interval in milliseconds to retry connecting to the server, set 0 to disable retrying
     * @default 1000
     */
    retryInterval?: number;
};
