const Joi = require('joi');

const getSummary = {
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().when('startDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('startDate')),
    }),
  }),
};

const getCategoryBreakdown = {
  query: Joi.object({
    type: Joi.string().valid('income', 'expense'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

const getMonthlyTrends = {
  query: Joi.object({
    year: Joi.number().integer().min(2000).max(2100),
  }),
};

const getRecentActivity = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),
};

const getAuditLogs = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    action: Joi.string().valid('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'LOGIN', 'EXPORT', 'IMPORT'),
    entity: Joi.string().valid('FinancialRecord', 'User'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

const getEntityAuditTrail = {
  params: Joi.object({
    entity: Joi.string().valid('FinancialRecord', 'User').required(),
    entityId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const exportRecords = {
  query: Joi.object({
    format: Joi.string().valid('csv', 'json').default('csv'),
    type: Joi.string().valid('income', 'expense'),
    category: Joi.string().trim(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getAuditLogs,
  getEntityAuditTrail,
  exportRecords,
};
