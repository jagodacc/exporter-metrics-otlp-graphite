import { OTLPGraphiteMetricExporter } from '../src';

describe("OltpGraphiteMetricExporter", () => {
    it('should create an instance of OTLPGraphiteMetricExporter', () => {
        const exporter = new OTLPGraphiteMetricExporter({
            host: 'localhost',
        });

        expect(exporter).toBeDefined();
    });
});
