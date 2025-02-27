export type HttpClientOptions = {
    protocol?: 'http' | 'https';
    host: string;
    path?: string;
    user?: string;
    password?: string;
    apiKey?: string;
    additionalHeaders?: Record<string, string>;
};
