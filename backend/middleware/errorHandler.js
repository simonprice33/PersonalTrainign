/**
 * Error Handling Middleware
 * Implements Single Responsibility Principle - handles only error responses
 */

class ErrorHandler {
  /**
   * Global error handling middleware
   * @param {Error} err Error object
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @param {Function} next Express next function
   */
  static handle(err, req, res, next) {
    console.error('❌ Unhandled error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Default error response
    const response = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    };

    // Add error details in development
    if (process.env.NODE_ENV === 'development') {
      response.error = {
        message: err.message,
        stack: err.stack
      };
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
      response.message = 'Validation failed';
      response.details = err.details;
      return res.status(400).json(response);
    }

    if (err.name === 'UnauthorizedError') {
      response.message = 'Unauthorized access';
      return res.status(401).json(response);
    }

    if (err.name === 'ForbiddenError') {
      response.message = 'Access forbidden';
      return res.status(403).json(response);
    }

    if (err.name === 'NotFoundError') {
      response.message = 'Resource not found';
      return res.status(404).json(response);
    }

    // Default to 500 Internal Server Error
    res.status(500).json(response);
  }

  /**
   * 404 Not Found handler
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static notFound(req, res) {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Async wrapper to catch promise rejections
   * @param {Function} fn Async function to wrap
   * @returns {Function} Wrapped function
   */
  static asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Create custom error
   * @param {string} message Error message
   * @param {number} statusCode HTTP status code
   * @param {string} name Error name
   * @returns {Error} Custom error
   */
  static createError(message, statusCode = 500, name = 'CustomError') {
    const error = new Error(message);
    error.name = name;
    error.statusCode = statusCode;
    return error;
  }

  /**
   * Validation error helper
   * @param {string} message Error message
   * @param {Object} details Validation details
   * @returns {Error} Validation error
   */
  static validationError(message, details = {}) {
    const error = new Error(message);
    error.name = 'ValidationError';
    error.details = details;
    return error;
  }
}

module.exports = ErrorHandler;