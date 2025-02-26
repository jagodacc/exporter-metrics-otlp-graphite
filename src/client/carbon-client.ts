import { diag } from '@opentelemetry/api';
import net from 'node:net';
import type { GraphiteMetric, GraphitePlaintextExporterOptions } from '../interfaces';
import type { GraphiteClientInterface } from '../interfaces/graphite-client.interface';

export class CarbonClient implements GraphiteClientInterface {
    private logger = diag.createComponentLogger({
        namespace: '[exporter-metrics-otlp-graphite:CarbonClient]'
    });

    private client: net.Socket;

    constructor(options: GraphitePlaintextExporterOptions) {
        this.client = new net.Socket();
        this.client
            .connect({
                host: options.host,
                port: options.port ?? 2003
            })
            .on('error', (err) => {
                this.logger.error(`Failed to connect to Graphite: ${err}`);
            });
    }

    public writeMetrics(metrics: GraphiteMetric[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let message = '';

            for (const metric of metrics) {
                message += `${metric.name} ${metric.value} ${metric.time}\n`;
            }

            this.client.write(message, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public close(): void {
        this.logger.debug('Closing Graphite client');

        this.client.end();
    }
}
