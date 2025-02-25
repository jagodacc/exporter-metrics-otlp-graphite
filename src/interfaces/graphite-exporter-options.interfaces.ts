export interface GraphiteExporterOptions {
    protocol?: "http" | "https";
    host: string;
    port?: number;
    path?: string;
    user?: string;
    password?: string;
    apiKey?: string;
    additionalHeaders?: Record<string, string>;
    metricPrefix?: string;
    interval?: number;
}
