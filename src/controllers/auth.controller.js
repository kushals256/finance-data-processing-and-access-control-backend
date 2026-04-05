const { StatusCodes } = require('http-status-codes');
const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc Register a new user
 */
const register = catchAsync(async (req, res) => {
  const { user, token } = await authService.register(req.body);

  ApiResponse.created(res, {
    message: 'User registered successfully',
    data: { user, token },
  });
});

/**
 * @desc Login user
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login(email, password, req);

  ApiResponse.success(res, {
    message: 'Login successful',
    data: { user, token },
  });
});

/**
 * @desc Get current user profile
 */
const getMe = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user._id);

  ApiResponse.success(res, {
    message: 'Profile retrieved successfully',
    data: { user },
  });
});

module.exports = { register, login, getMe };
