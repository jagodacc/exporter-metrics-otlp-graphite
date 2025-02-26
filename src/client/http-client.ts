import { diag } from '@opentelemetry/api';
import type { GraphiteHttpExporterOptions, GraphiteMetric } from '../interfaces';
import type { GraphiteClientInterface } from '../interfaces/graphite-client.interface';

export class HttpClient implements GraphiteClientInterface {
    private readonly logger = diag.createComponentLogger({
        namespace: '[exporter-metrics-otlp-graphite:HttpClient]'
    });

    private readonly baseURL: string;

    private readonly headers: Record<string, string>;

    constructor(options: GraphiteHttpExporterOptions) {
        options.protocol = options.protocol === 'https' ? 'https' : 'http';
        options.path = options.path ?? '/metrics';

        if (!options.path.startsWith('/')) {
            options.path = `/${options.path}`;
        }

        this.baseURL = `${options.protocol}://${options.host}${options.path}`;
        this.headers = { 'Content-Type': 'application/json', ...options.additionalHeaders };

        if (options.apiKey) {
            this.headers.Authorization = `Bearer ${options.user ? `${options.user}:` : ''}${options.apiKey}`;
        } else if (options.user && options.password) {
            this.headers.Authorization = `Basic ${Buffer.from(`${options.user}:${options.password}`).toString('base64')}`;
        }
    }

    public async writeMetrics(metrics: GraphiteMetric[]): Promise<void> {
        // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Fetch is supported in Node.js 18+
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(metrics)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, response: ${await response.text()}`);
        }

        this.logger.debug('Metrics flushed successfully');
    }

    public close(): void {
        this.logger.debug('Closing Graphite client');
    }
}
