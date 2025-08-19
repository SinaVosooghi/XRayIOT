export const RMQ_TOPOLOGY = {
  exchange: 'iot.xray',
  routingKey: 'xray.raw',
  queue: 'xray.raw.q',
  dlx: 'iot.dlx',
  dlq: 'xray.raw.dlq',
  dlqRoutingKey: 'xray.raw.fail',
};
