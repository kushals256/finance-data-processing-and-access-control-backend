const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');
const auditService = require('./audit.service');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Register a new user
 */
const register = async (userData) => {
  // Check for existing user
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists.');
  }

  const user = await User.create(userData);
  const token = generateToken(user._id);

  return { user, token };
};

/**
 * Login user with email and password
 */
const login = async (email, password, req = null) => {
  // Include password field explicitly
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateModifiedOnly: true });

  const token = generateToken(user._id);

  // Audit log the login
  if (req) {
    await auditService.log({
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      performedBy: user._id,
      after: { email: user.email, role: user.role },
      req,
    });
  }

  return { user, token };
};

/**
 * Get user profile by ID
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  return user;
};

module.exports = { register, login, getProfile, generateToken };
