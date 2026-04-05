const FinancialRecord = require('../models/FinancialRecord');
const config = require('../config/env');
const { ANOMALY_FLAGS } = require('../constants/anomalyRules');
const logger = require('../config/logger');

/**
 * Anomaly Detection Service
 *
 * Runs rule-based checks on financial transactions to flag suspicious activity.
 * Flags are stored on the record and visible in API responses and dashboard stats.
 *
 * Rules:
 * 1. HIGH_AMOUNT_FOR_CATEGORY — amount > N× the category average
 * 2. RAPID_TRANSACTIONS — >N transactions in M seconds by the same user
 * 3. EXCEEDS_THRESHOLD — amount exceeds an absolute configurable threshold
 */

/**
 * Get the average amount for a given category
 */
const getCategoryAverage = async (category) => {
  const result = await FinancialRecord.aggregate([
    { $match: { category, isDeleted: false } },
    { $group: { _id: null, avg: { $avg: '$amount' } } },
  ]);

  return result.length > 0 ? result[0].avg : 0;
};

/**
 * Count recent transactions by a user within a time window
 */
const getRecentTransactionCount = async (userId, windowSeconds) => {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  return FinancialRecord.countDocuments({
    createdBy: userId,
    isDeleted: false,
    createdAt: { $gte: windowStart },
  });
};

/**
 * Run all anomaly detection rules against a record
 *
 * @param {Object} record - The financial record to check
 * @returns {string[]} Array of anomaly flag identifiers
 */
const detectAnomalies = async (record) => {
  const flags = [];

  try {
    // Rule 1: Amount exceeds category average by multiplier
    const categoryAvg = await getCategoryAverage(record.category);
    if (categoryAvg > 0 && record.amount > categoryAvg * config.anomaly.categoryMultiplier) {
      flags.push(ANOMALY_FLAGS.HIGH_AMOUNT_FOR_CATEGORY);
      logger.info(`Anomaly detected: HIGH_AMOUNT_FOR_CATEGORY — amount ${record.amount} vs avg ${categoryAvg.toFixed(2)} for category "${record.category}"`);
    }

    // Rule 2: Rapid successive transactions
    const recentCount = await getRecentTransactionCount(
      record.createdBy,
      config.anomaly.rapidTxWindowSeconds
    );
    if (recentCount >= config.anomaly.rapidTxCount) {
      flags.push(ANOMALY_FLAGS.RAPID_TRANSACTIONS);
      logger.info(`Anomaly detected: RAPID_TRANSACTIONS — ${recentCount} transactions in ${config.anomaly.rapidTxWindowSeconds}s by user ${record.createdBy}`);
    }

    // Rule 3: Exceeds absolute threshold
    if (record.amount > config.anomaly.amountThreshold) {
      flags.push(ANOMALY_FLAGS.EXCEEDS_THRESHOLD);
      logger.info(`Anomaly detected: EXCEEDS_THRESHOLD — amount ${record.amount} exceeds threshold ${config.anomaly.amountThreshold}`);
    }
  } catch (error) {
    // Anomaly detection should never break record creation
    logger.error(`Anomaly detection error: ${error.message}`);
  }

  return flags;
};

module.exports = { detectAnomalies };
