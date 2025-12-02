/**
 * Authentication Middleware
 * Implements Single Responsibility Principle - handles only JWT authentication
 */

const jwt = require('jsonwebtoken');

class AuthMiddleware {
  constructor(jwtSecret) {
    this.jwtSecret = jwtSecret;
  }

  /**
   * Generate JWT tokens
   * @param {Object} payload Token payload
   * @param {string} expiresIn Token expiry
   * @returns {string} JWT token
   */
  generateToken(payload, expiresIn) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  /**
   * Generate refresh token
   * @param {Object} payload Token payload
   * @param {string} expiresIn Token expiry
   * @returns {string} Refresh token
   */
  generateRefreshToken(payload, expiresIn) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  /**
   * Admin JWT Authentication Middleware
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @param {Function} next Express next function
   */
  authenticateAdminToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    jwt.verify(token, this.jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      // Ensure this is an admin token
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      req.user = user;
      next();
    });
  }

  /**
   * Client JWT Authentication Middleware
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @param {Function} next Express next function
   */
  authenticateClientToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    jwt.verify(token, this.jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      // Ensure this is a client token
      if (user.type !== 'client') {
        return res.status(403).json({
          success: false,
          message: 'Invalid token type - client access required'
        });
      }
      
      req.user = user;
      next();
    });
  }

  /**
   * Verify JWT token without middleware
   * @param {string} token JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    return jwt.verify(token, this.jwtSecret);
  }

  /**
   * Decode JWT token without verification
   * @param {string} token JWT token
   * @returns {Object} Decoded token payload
   */
  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = AuthMiddleware;