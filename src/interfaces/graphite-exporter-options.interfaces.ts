export type GraphitePlaintextExporterOptions = {
    protocol: 'plaintext';
    host: string;
    port?: number;
    metricPrefix?: string;
    interval?: number;
};

export type GraphiteHttpExporterOptions = {
    protocol?: 'http' | 'https';
    host: string;
    path?: string;
    user?: string;
    password?: string;
    apiKey?: string;
    additionalHeaders?: Record<string, string>;
    metricPrefix?: string;
    interval?: number;
};

export type GraphiteExporterOptions = GraphitePlaintextExporterOptions | GraphiteHttpExporterOptions;
