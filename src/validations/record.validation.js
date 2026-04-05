const Joi = require('joi');

const createRecord = {
  body: Joi.object({
    amount: Joi.number().positive().precision(2).max(999999999.99).required()
      .messages({
        'number.positive': 'Amount must be a positive number',
        'number.max': 'Amount cannot exceed 999,999,999.99',
        'any.required': 'Amount is required',
      }),
    type: Joi.string().valid('income', 'expense').required()
      .messages({
        'any.only': 'Type must be either income or expense',
        'any.required': 'Type is required',
      }),
    category: Joi.string().trim().min(2).max(50).required()
      .messages({
        'any.required': 'Category is required',
      }),
    date: Joi.date().iso().max('now').required()
      .messages({
        'date.max': 'Date cannot be in the future',
        'any.required': 'Date is required',
      }),
    description: Joi.string().trim().max(500).allow(''),
    notes: Joi.string().trim().max(1000).allow(''),
  }),
};

const updateRecord = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    amount: Joi.number().positive().precision(2).max(999999999.99),
    type: Joi.string().valid('income', 'expense'),
    category: Joi.string().trim().min(2).max(50),
    date: Joi.date().iso().max('now'),
    description: Joi.string().trim().max(500).allow(''),
    notes: Joi.string().trim().max(1000).allow(''),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),
};

const getRecords = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    type: Joi.string().valid('income', 'expense'),
    category: Joi.string().trim(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().when('startDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('startDate')),
    }),
    search: Joi.string().trim().max(100),
    sortBy: Joi.string().valid('date', 'amount', 'category', 'createdAt').default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    flagged: Joi.boolean(),
  }),
};

const getRecordById = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const deleteRecord = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = { createRecord, updateRecord, getRecords, getRecordById, deleteRecord };
