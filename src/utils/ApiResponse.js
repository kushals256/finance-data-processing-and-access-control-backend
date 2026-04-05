/**
 * Standardized API response wrapper.
 * Ensures consistent response shape across all endpoints.
 */
class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  static success(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
    const response = new ApiResponse(statusCode, message, data, meta);
    return res.status(statusCode).json(response);
  }

  static created(res, { message = 'Created successfully', data = null } = {}) {
    return ApiResponse.success(res, { statusCode: 201, message, data });
  }

  static paginated(res, { message = 'Success', data = [], pagination = {} } = {}) {
    return ApiResponse.success(res, {
      statusCode: 200,
      message,
      data,
      meta: { pagination },
    });
  }
}

module.exports = ApiResponse;
