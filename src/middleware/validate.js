const ApiError = require('../utils/ApiError');

/**
 * Joi Validation Middleware
 *
 * Wraps Joi schemas to validate req.body, req.query, and req.params.
 * Returns structured field-level errors on validation failure.
 *
 * Usage:
 *   validate({ body: bodySchema, query: querySchema, params: paramsSchema })
 *
 * @param {Object} schema - Object with optional keys: body, query, params
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const validationErrors = [];

  ['params', 'query', 'body'].forEach((key) => {
    if (schema[key]) {
      const { error, value } = schema[key].validate(req[key], {
        abortEarly: false,       // Collect all errors, not just the first
        stripUnknown: true,      // Remove unknown fields
        allowUnknown: false,     // Reject unknown fields in body
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
        }));
        validationErrors.push(...errors);
      } else {
        // Replace with validated (and potentially coerced) values
        req[key] = value;
      }
    }
  });

  if (validationErrors.length > 0) {
    return next(ApiError.badRequest('Validation failed', validationErrors));
  }

  next();
};

module.exports = validate;
