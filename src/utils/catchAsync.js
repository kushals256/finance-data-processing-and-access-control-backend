/**
 * Wraps async route handlers to catch errors and forward to error handler.
 * Eliminates try/catch boilerplate in every controller.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
