import { GraphiteMetric } from './graphite-metric.interfaces';

export interface GraphiteClientInterface {
    writeMetrics(metrics: GraphiteMetric[]): void | Promise<void>;
    close(): void | Promise<void>;
}
