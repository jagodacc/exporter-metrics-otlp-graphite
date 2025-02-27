import { CarbonClientOptions } from '../clients/carbon-client/carbon-client-options.type';
import { HttpClientOptions } from '../clients/http-client/http-client-options.type';

export type GraphiteExporterOptions = {
    metricPrefix?: string;
    interval?: number;
} & (CarbonClientOptions | HttpClientOptions);
