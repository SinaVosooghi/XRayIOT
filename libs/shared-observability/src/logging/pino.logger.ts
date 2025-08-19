import pino from 'pino';

export const createPinoLogger = (context?: string) => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const isProduction = process.env.NODE_ENV === 'production';

  return pino({
    name: context || 'iot-xray',
    level: isProduction ? 'info' : logLevel,
    transport: isProduction ? undefined : { target: 'pino-pretty' },
  });
};
