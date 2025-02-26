# OpenTelemetry Metrics Exporter for Graphite

This package provides a metrics exporter from OpenTelemetry to Graphite in Node.js applications.

## Installation

```bash
npm install --save @jagodacc/exporter-metrics-otlp-graphite
```

## Usage

### Graphite plaintext protocol

```javascript
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@jagodacc/exporter-metrics-otlp-graphite');

const metricExporter = new OTLPGraphiteExporter({
    host: 'graphite.example.com',
    interval: 30000
});
const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 30000
    }),
  ],
});

// Now, start recording data
const meter = meterProvider.getMeter('example-meter');
const counter = meter.createCounter('metric_name');
counter.add(10, { 'key': 'value' });
```

### Graphite HTTP Api eg. Grafana Cloud

```javascript
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@jagodacc/exporter-metrics-otlp-graphite');

const metricExporter = new OTLPGraphiteExporter({
    host: 'graphite-prod-24-prod-eu-west-2.grafana.net',
    protocol: 'https',
    path: '/graphite/metrics',
    user: '123456',
    apiKey: 'WW91J3JlIGN1cmlvdXMuLi4gOikKCgoKCgoKCg==',
    interval: 30000
});
const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 30000
    }),
  ],
});

// Now, start recording data
const meter = meterProvider.getMeter('example-meter');
const counter = meter.createCounter('metric_name');
counter.add(10, { 'key': 'value' });
```
