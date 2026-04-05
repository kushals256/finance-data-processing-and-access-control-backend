/**
 * Anomaly detection rule identifiers and configuration.
 * Used by the anomaly service to flag suspicious transactions.
 */

const ANOMALY_FLAGS = {
  HIGH_AMOUNT_FOR_CATEGORY: 'HIGH_AMOUNT_FOR_CATEGORY',
  RAPID_TRANSACTIONS: 'RAPID_TRANSACTIONS',
  EXCEEDS_THRESHOLD: 'EXCEEDS_THRESHOLD',
};

const ANOMALY_DESCRIPTIONS = {
  [ANOMALY_FLAGS.HIGH_AMOUNT_FOR_CATEGORY]:
    'Transaction amount exceeds the category average by a significant multiplier',
  [ANOMALY_FLAGS.RAPID_TRANSACTIONS]:
    'Multiple transactions created in rapid succession by the same user',
  [ANOMALY_FLAGS.EXCEEDS_THRESHOLD]:
    'Transaction amount exceeds the configured absolute threshold',
};

module.exports = { ANOMALY_FLAGS, ANOMALY_DESCRIPTIONS };
