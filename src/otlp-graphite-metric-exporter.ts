import { type Attributes, diag } from '@opentelemetry/api';
import { type ExportResult, ExportResultCode } from '@opentelemetry/core';
import { AggregationTemporality, DataPointType, InstrumentType, type PushMetricExporter, type ResourceMetrics } from '@opentelemetry/sdk-metrics';
import { CarbonClient } from './clients/carbon-client';
import { HttpClient } from './clients/http-client';
import { EXPORTER_NAMESPACE } from './consts';
import type { GraphiteExporterOptions, GraphiteMetric } from './interfaces';
import type { GraphiteClientInterface } from './interfaces/graphite-client.interface';

export class OTLPGraphiteMetricExporter implements PushMetricExporter {
    private readonly logger = diag.createComponentLogger({ namespace: EXPORTER_NAMESPACE });

    private readonly metricPrefix: string;

    private readonly interval: number;

    private readonly client: GraphiteClientInterface;

    private metricsCache: GraphiteMetric[] = [];

    constructor(options: GraphiteExporterOptions) {
        this.metricPrefix = options.metricPrefix ?? 'otlp';
        this.interval = options.interval ?? 60000;

        if (this.metricPrefix.endsWith('.')) {
            this.metricPrefix = this.metricPrefix.slice(0, -1);
        }

        if (options.protocol === 'plaintext') {
            this.client = new CarbonClient(options);
        } else {
            this.client = new HttpClient(options);
        }
    }

    public selectAggregationTemporality(instrumentType: InstrumentType): AggregationTemporality {
        if (instrumentType === InstrumentType.UP_DOWN_COUNTER || instrumentType === InstrumentType.OBSERVABLE_UP_DOWN_COUNTER) {
            return AggregationTemporality.CUMULATIVE;
        }

        return AggregationTemporality.DELTA;
    }

    public async export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): Promise<void> {
        try {
            for (const scopeMetric of metrics.scopeMetrics) {
                for (const metric of scopeMetric.metrics) {
                    switch (metric.dataPointType) {
                        case DataPointType.SUM:
                        case DataPointType.GAUGE: {
                            const graphiteMetrics: GraphiteMetric[] = metric.dataPoints.map((dataPoint) => ({
                                name: metric.descriptor.name,
                                value: dataPoint.value,
                                time: dataPoint.startTime[0],
                                interval: this.interval,
                                tags: this.attributesToTags(dataPoint.attributes)
                            }));

                            this.writeMetrics(graphiteMetrics);

                            break;
                        }
                        case DataPointType.HISTOGRAM: {
                            const metrics: GraphiteMetric[] = [];

                            for (const dataPoint of metric.dataPoints) {
                                const tags = this.attributesToTags(dataPoint.attributes);

                                metrics.push(
                                    ...[
                                        {
                                            name: metric.descriptor.name,
                                            value: dataPoint.value.sum ?? 0,
                                            time: dataPoint.startTime[0],
                                            interval: this.interval,
                                            tags
                                        },
                                        {
                                            name: `${metric.descriptor.name}.count`,
                                            value: dataPoint.value.count,
                                            time: dataPoint.startTime[0],
                                            interval: this.interval,
                                            tags
                                        },
                                        {
                                            name: `${metric.descriptor.name}.min`,
                                            value: dataPoint.value.min ?? 0,
                                            time: dataPoint.startTime[0],
                                            interval: this.interval,
                                            tags
                                        },
                                        {
                                            name: `${metric.descriptor.name}.max`,
                                            value: dataPoint.value.max ?? 0,
                                            time: dataPoint.startTime[0],
                                            interval: this.interval,
                                            tags
                                        }
                                    ]
                                );

                                dataPoint.value.buckets.counts.map((count, index) => {
                                    const bucket = dataPoint.value.buckets.boundaries[index] ?? 'max';
                                    const lastBucket = dataPoint.value.buckets.boundaries[index - 1] ?? 'min';

                                    metrics.push({
                                        name: `${metric.descriptor.name}.${lastBucket.toString().replace('.', '_')}_to_${bucket.toString().replace('.', '_')}`,
                                        value: count,
                                        time: dataPoint.startTime[0],
                                        interval: this.interval,
                                        tags
                                    });
                                });
                            }

                            this.writeMetrics(metrics);

                            break;
                        }
                        case DataPointType.EXPONENTIAL_HISTOGRAM: {
                            this.logger.warn(`Unsupported metric type: ${metric.dataPointType}`);
                        }
                    }
                }
            }

            await this.forceFlush();

            resultCallback({ code: ExportResultCode.SUCCESS });
        } catch (error: any) {
            resultCallback({ code: ExportResultCode.FAILED, error });
        }
    }

    private attributesToTags(attributes: Attributes): string[] {
        return Object.entries(attributes).reduce((tags: string[], [key, value]) => {
            if (typeof value === 'string' || typeof value === 'number') {
                tags.push(`${this.sanitizeGraphiteTag(key)}=${this.sanitizeGraphiteTag(value.toString())}`);
            }

            return tags;
        }, []);
    }

    private sanitizeGraphiteTag(value: string): string {
        return value.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    private writeMetrics(metrics: GraphiteMetric[]): void {
        this.logger.debug(`Writing metrics: ${JSON.stringify(metrics)}`);

        metrics = metrics.map((metric) => ({
            ...metric,
            name: `${this.metricPrefix}.${metric.name}`
        }));

        this.metricsCache.push(...metrics);
    }

    public async forceFlush(): Promise<void> {
        this.logger.debug('Flushing metrics');

        if (!Object.keys(this.metricsCache).length) {
            return;
        }

        try {
            await this.client.writeMetrics(this.metricsCache);

            this.metricsCache = [];
        } catch (error: any) {
            this.logger.error(`Error flushing metrics: ${JSON.stringify(error)}`);

            throw error;
        }
    }

    public shutdown(): Promise<void> {
        const shutdownPromise = this.client.close();

        if (shutdownPromise instanceof Promise) {
            return shutdownPromise;
        }

        return Promise.resolve();
    }
}
