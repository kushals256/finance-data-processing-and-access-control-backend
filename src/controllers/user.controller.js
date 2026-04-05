const userService = require('../services/user.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, getPaginationMeta } = require('../utils/pagination');

/**
 * @desc Get all users (paginated, filterable)
 */
const getUsers = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { users, total } = await userService.getAllUsers(req.query, { skip, limit });

  ApiResponse.paginated(res, {
    message: 'Users retrieved successfully',
    data: users,
    pagination: getPaginationMeta(page, limit, total),
  });
});

/**
 * @desc Get user by ID
 */
const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  ApiResponse.success(res, {
    message: 'User retrieved successfully',
    data: { user },
  });
});

/**
 * @desc Update user (role, status, name)
 */
const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(
    req.params.id,
    req.body,
    req.user._id,
    req
  );

  ApiResponse.success(res, {
    message: 'User updated successfully',
    data: { user },
  });
});

/**
 * @desc Delete user
 */
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user._id, req);

  ApiResponse.success(res, {
    message: 'User deleted successfully',
  });
});

module.exports = { getUsers, getUserById, updateUser, deleteUser };
