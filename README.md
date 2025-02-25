# OpenTelemetry Metrics Exporter for Graphite

This package provides a metrics exporter from OpenTelemetry to Graphite in Node.js applications.

## Installation

```bash
npm install --save @jagodacc/exporter-metrics-otlp-graphite
```

## Usage

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
