const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const auditService = require('./audit.service');

/**
 * User Management Service (Admin operations)
 */

/**
 * Get all users with filters and pagination
 */
const getAllUsers = async (filters, { skip, limit }) => {
  const query = {};

  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return { users, total };
};

/**
 * Get a user by ID
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  return user;
};

/**
 * Update a user (role, status, name)
 */
const updateUser = async (id, updates, performedBy, req) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const before = user.toJSON();

  // Prevent admin from deactivating themselves
  if (updates.status === 'inactive' && id === performedBy.toString()) {
    throw ApiError.badRequest('You cannot deactivate your own account.');
  }

  // Prevent admin from changing their own role
  if (updates.role && id === performedBy.toString()) {
    throw ApiError.badRequest('You cannot change your own role.');
  }

  Object.assign(user, updates);
  await user.save();

  // Audit log
  await auditService.log({
    action: 'UPDATE',
    entity: 'User',
    entityId: user._id,
    performedBy,
    before,
    after: user.toJSON(),
    req,
  });

  return user;
};

/**
 * Delete a user
 */
const deleteUser = async (id, performedBy, req) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  // Prevent admin from deleting themselves
  if (id === performedBy.toString()) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }

  const before = user.toJSON();
  await User.findByIdAndDelete(id);

  // Audit log
  await auditService.log({
    action: 'DELETE',
    entity: 'User',
    entityId: user._id,
    performedBy,
    before,
    req,
  });

  return user;
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
