import { diag } from '@opentelemetry/api';
import net from 'node:net';
import { EXPORTER_NAMESPACE } from '../../consts';
import type { GraphiteMetric } from '../../interfaces';
import type { GraphiteClientInterface } from '../../interfaces/graphite-client.interface';
import type { CarbonClientOptions } from './carbon-client-options.type';
import { CarbonClientState } from './carbon-client-state.enum';

export class CarbonClient implements GraphiteClientInterface {
    private readonly logger = diag.createComponentLogger({ namespace: `${EXPORTER_NAMESPACE}:carbon-client` });

    private options: Required<CarbonClientOptions>;

    private client!: net.Socket;

    private state: CarbonClientState = CarbonClientState.DISCONNECTED;

    constructor(options: CarbonClientOptions) {
        this.options = {
            keepAlive: true,
            port: 2003,
            retryInterval: 1000,
            ...options
        };

        this.connect();
    }

    public writeMetrics(metrics: GraphiteMetric[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.state !== CarbonClientState.CONNECTED) {
                return reject(new Error('Client is not connected'));
            }

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

        this.client.removeAllListeners();
        this.client.end();
        this.client.destroy();
    }

    private connect(): void {
        this.state = CarbonClientState.CONNECTING;

        this.client = new net.Socket();
        this.client
            .connect({
                host: this.options.host,
                port: this.options.port,
                keepAlive: this.options.keepAlive
            })
            .on('connect', () => {
                this.logger.debug('Connected to Graphite');
                this.state = CarbonClientState.CONNECTED;
            })
            .on('error', (err) => {
                this.logger.error(`Error on Graphite connection: ${err.message}`);
            })
            .on('close', () => {
                if (this.state === CarbonClientState.CONNECTED && this.options.retryInterval) {
                    setTimeout(() => {
                        this.logger.debug('Connection closed. Reconnecting...');

                        this.state = CarbonClientState.DISCONNECTED;
                        this.client.destroy();
                        this.client.removeAllListeners();

                        this.connect();
                    }, this.options.retryInterval);
                }
            });
    }
}
