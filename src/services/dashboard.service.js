const FinancialRecord = require('../models/FinancialRecord');

/**
 * Dashboard Service
 *
 * All methods use MongoDB Aggregation Pipelines for efficient
 * server-side data processing and analytics.
 */

/**
 * Build base match stage (excludes soft-deleted, applies optional date range)
 */
const buildBaseMatch = (filters = {}) => {
  const match = { isDeleted: false };
  if (filters.startDate || filters.endDate) {
    match.date = {};
    if (filters.startDate) match.date.$gte = new Date(filters.startDate);
    if (filters.endDate) match.date.$lte = new Date(filters.endDate);
  }
  return match;
};

/**
 * Summary: total income, total expenses, net balance, counts, averages
 */
const getSummary = async (filters = {}) => {
  const match = buildBaseMatch(filters);

  const result = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avg: { $avg: '$amount' },
        max: { $max: '$amount' },
        min: { $min: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        total: { $round: ['$total', 2] },
        count: 1,
        avg: { $round: ['$avg', 2] },
        max: { $round: ['$max', 2] },
        min: { $round: ['$min', 2] },
      },
    },
  ]);

  // Reshape into a structured summary
  const income = result.find((r) => r.type === 'income') || { total: 0, count: 0, avg: 0, max: 0, min: 0 };
  const expense = result.find((r) => r.type === 'expense') || { total: 0, count: 0, avg: 0, max: 0, min: 0 };

  return {
    income: { total: income.total, count: income.count, average: income.avg, max: income.max, min: income.min },
    expense: { total: expense.total, count: expense.count, average: expense.avg, max: expense.max, min: expense.min },
    netBalance: parseFloat((income.total - expense.total).toFixed(2)),
    totalRecords: income.count + expense.count,
  };
};

/**
 * Category breakdown with totals and percentages
 */
const getCategoryBreakdown = async (filters = {}) => {
  const match = buildBaseMatch(filters);
  if (filters.type) match.type = filters.type;

  const result = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        categories: { $push: { category: '$_id.category', type: '$_id.type', total: '$total', count: '$count' } },
        grandTotal: { $sum: '$total' },
      },
    },
    { $unwind: '$categories' },
    {
      $project: {
        _id: 0,
        category: '$categories.category',
        type: '$categories.type',
        total: { $round: ['$categories.total', 2] },
        count: '$categories.count',
        percentage: {
          $round: [{ $multiply: [{ $divide: ['$categories.total', '$grandTotal'] }, 100] }, 2],
        },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return result;
};

/**
 * Monthly trends — income/expense/net grouped by month
 */
const getMonthlyTrends = async (year) => {
  const targetYear = year || new Date().getFullYear();
  const startDate = new Date(`${targetYear}-01-01`);
  const endDate = new Date(`${targetYear}-12-31T23:59:59.999Z`);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  // Reshape into monthly objects with income/expense/net
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const incomeData = result.find((r) => r._id.month === m && r._id.type === 'income');
    const expenseData = result.find((r) => r._id.month === m && r._id.type === 'expense');

    const income = incomeData ? incomeData.total : 0;
    const expense = expenseData ? expenseData.total : 0;

    months.push({
      month: m,
      monthName: new Date(targetYear, m - 1, 1).toLocaleString('default', { month: 'long' }),
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      net: parseFloat((income - expense).toFixed(2)),
      transactionCount: (incomeData?.count || 0) + (expenseData?.count || 0),
    });
  }

  return { year: targetYear, months };
};

/**
 * Weekly trends — last 7 days
 */
const getWeeklyTrends = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  // Build 7-day array
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const incomeData = result.find((r) => r._id.date === dateStr && r._id.type === 'income');
    const expenseData = result.find((r) => r._id.date === dateStr && r._id.type === 'expense');

    const income = incomeData ? incomeData.total : 0;
    const expense = expenseData ? expenseData.total : 0;

    days.push({
      date: dateStr,
      dayName: d.toLocaleString('default', { weekday: 'long' }),
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      net: parseFloat((income - expense).toFixed(2)),
      transactionCount: (incomeData?.count || 0) + (expenseData?.count || 0),
    });
  }

  return { days };
};

/**
 * Recent activity — last N transactions
 */
const getRecentActivity = async (limit = 10) => {
  return FinancialRecord.find({ isDeleted: false })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

/**
 * Anomaly stats — count of flagged records by flag type
 */
const getAnomalyStats = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { isDeleted: false, 'flags.0': { $exists: true } } },
    { $unwind: '$flags' },
    {
      $group: {
        _id: '$flags',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        flag: '$_id',
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  const totalFlagged = await FinancialRecord.countDocuments({
    isDeleted: false,
    'flags.0': { $exists: true },
  });

  return { totalFlaggedRecords: totalFlagged, flagBreakdown: result };
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getAnomalyStats,
};
