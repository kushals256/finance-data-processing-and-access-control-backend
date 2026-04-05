const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_dashboard',

  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  anomaly: {
    amountThreshold: parseFloat(process.env.ANOMALY_AMOUNT_THRESHOLD) || 50000,
    categoryMultiplier: parseFloat(process.env.ANOMALY_CATEGORY_MULTIPLIER) || 3,
    rapidTxCount: parseInt(process.env.ANOMALY_RAPID_TX_COUNT, 10) || 5,
    rapidTxWindowSeconds: parseInt(process.env.ANOMALY_RAPID_TX_WINDOW_SECONDS, 10) || 60,
  },

  csv: {
    maxFileSizeMB: parseInt(process.env.CSV_MAX_FILE_SIZE_MB, 10) || 5,
  },
};
