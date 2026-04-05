const winston = require('winston');
const { AsyncLocalStorage } = require('async_hooks');
const config = require('./env');

// AsyncLocalStorage for correlation ID propagation
const asyncLocalStorage = new AsyncLocalStorage();

const getCorrelationId = () => {
  const store = asyncLocalStorage.getStore();
  return store?.correlationId || 'no-correlation-id';
};

const logger = winston.createLogger({
  level: config.nodeEnv === 'test' ? 'silent' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format((info) => {
      info.correlationId = getCorrelationId();
      return info;
    })(),
    config.nodeEnv === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${correlationId}] ${level}: ${message}${metaStr}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
module.exports.asyncLocalStorage = asyncLocalStorage;
module.exports.getCorrelationId = getCorrelationId;
