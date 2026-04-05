const Joi = require('joi');

const register = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required',
      }),
    email: Joi.string().email().required().lowercase().trim()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
        'any.required': 'Password is required',
      }),
    role: Joi.string().valid('viewer', 'analyst', 'admin').default('viewer'),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required().lowercase().trim()
      .messages({ 'any.required': 'Email is required' }),
    password: Joi.string().required()
      .messages({ 'any.required': 'Password is required' }),
  }),
};

module.exports = { register, login };
