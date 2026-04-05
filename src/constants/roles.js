/**
 * RBAC Permission Matrix
 *
 * Defines roles and their associated permissions.
 * Used by the rbac middleware to enforce access control.
 */

const ROLES = {
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin',
};

const PERMISSIONS = {
  // Records
  VIEW_RECORDS: 'view_records',
  CREATE_RECORD: 'create_record',
  UPDATE_RECORD: 'update_record',
  DELETE_RECORD: 'delete_record',
  IMPORT_RECORDS: 'import_records',

  // Dashboard
  VIEW_DASHBOARD_SUMMARY: 'view_dashboard_summary',
  VIEW_RECENT_ACTIVITY: 'view_recent_activity',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_CATEGORY_BREAKDOWN: 'view_category_breakdown',
  VIEW_TRENDS: 'view_trends',

  // Export
  EXPORT_DATA: 'export_data',

  // Users
  MANAGE_USERS: 'manage_users',

  // Audit
  VIEW_AUDIT_LOGS: 'view_audit_logs',
};

/**
 * Role → Permissions mapping
 * Admin inherits all permissions.
 * Analyst inherits Viewer permissions + analytics & export.
 */
const ROLE_PERMISSIONS = {
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_RECORDS,
    PERMISSIONS.VIEW_DASHBOARD_SUMMARY,
    PERMISSIONS.VIEW_RECENT_ACTIVITY,
  ],
  [ROLES.ANALYST]: [
    PERMISSIONS.VIEW_RECORDS,
    PERMISSIONS.VIEW_DASHBOARD_SUMMARY,
    PERMISSIONS.VIEW_RECENT_ACTIVITY,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_CATEGORY_BREAKDOWN,
    PERMISSIONS.VIEW_TRENDS,
    PERMISSIONS.EXPORT_DATA,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin gets everything
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
};

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS, hasPermission };
