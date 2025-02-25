export interface GraphiteMetric {
    name: string;
    value: number;
    time: number;
    interval: number;
    tags?: Record<string, string>;
}
