import client from 'prom-client';

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const processed = new client.Counter({
  name: 'signals_processed_total',
  help: 'Processed signals',
  registers: [register],
});

export const failed = new client.Counter({
  name: 'signals_failed_total',
  help: 'Failed signals',
  registers: [register],
});

export const duration = new client.Histogram({
  name: 'signals_processing_seconds',
  help: 'Processing time',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});
