const { hasPermission } = require('../constants/roles');
const ApiError = require('../utils/ApiError');

/**
 * RBAC Authorization Middleware
 *
 * Higher-order middleware that checks if the authenticated user's role
 * has the required permission(s).
 *
 * Usage:
 *   router.get('/records', authenticate, authorize(PERMISSIONS.VIEW_RECORDS), controller)
 *   router.post('/records', authenticate, authorize(PERMISSIONS.CREATE_RECORD), controller)
 *
 * @param  {...string} requiredPermissions - One or more permissions required
 * @returns {Function} Express middleware
 */
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    const userRole = req.user.role;

    // Check if user's role has ALL required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(userRole, permission)
    );

    if (!hasAllPermissions) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${userRole}' does not have the required permissions: [${requiredPermissions.join(', ')}].`
        )
      );
    }

    next();
  };
};

module.exports = authorize;
