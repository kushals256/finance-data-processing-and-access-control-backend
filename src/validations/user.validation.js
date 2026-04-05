const Joi = require('joi');

const updateUser = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
      .messages({ 'string.length': 'Invalid user ID format' }),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50),
    role: Joi.string().valid('viewer', 'analyst', 'admin'),
    status: Joi.string().valid('active', 'inactive'),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),
};

const getUsers = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('viewer', 'analyst', 'admin'),
    status: Joi.string().valid('active', 'inactive'),
    search: Joi.string().trim().max(100),
  }),
};

const getUserById = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const deleteUser = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = { updateUser, getUsers, getUserById, deleteUser };
