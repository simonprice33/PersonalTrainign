/**
 * Authentication Service - Handles authentication logic
 * Implements Single Responsibility Principle
 */

const bcrypt = require('bcryptjs');

class AuthService {
  constructor(authMiddleware, collections) {
    this.authMiddleware = authMiddleware;
    this.collections = collections;
  }

  /**
   * Authenticate admin user
   */
  async authenticateAdmin(email, password) {
    try {
      const user = await this.collections.users.findOne({ email });
      
      if (!user) {
        console.log(`❌ Admin login failed: User not found for email ${email}`);
        throw new Error('Invalid credentials');
      }

      console.log(`🔍 Attempting admin login for: ${email}`);
      console.log(`🔍 Password hash exists: ${!!user.password}`);
      console.log(`🔍 Password length: ${password?.length || 0}`);
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        console.log(`❌ Admin login failed: Invalid password for ${email}`);
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = this.authMiddleware.generateToken(
        { 
          id: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_ACCESS_EXPIRY
      );

      const refreshToken = this.authMiddleware.generateRefreshToken(
        { 
          id: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_REFRESH_EXPIRY
      );

      console.log(`✅ Admin login successful: ${email}`);
      
      return {
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('❌ Admin authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate client user
   */
  async authenticateClient(email, password) {
    try {
      const clientUser = await this.collections.clientUsers.findOne({ email });
      
      if (!clientUser) {
        throw new Error('Invalid email or password');
      }

      if (!clientUser.password) {
        throw new Error('Password not set. Please check your email for password creation link.');
      }

      const isValidPassword = await bcrypt.compare(password, clientUser.password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate client tokens
      const accessToken = this.authMiddleware.generateToken(
        { 
          email: clientUser.email,
          type: 'client',
          status: clientUser.status
        },
        process.env.JWT_ACCESS_EXPIRY
      );

      const refreshToken = this.authMiddleware.generateRefreshToken(
        { 
          email: clientUser.email,
          type: 'client'
        },
        process.env.JWT_REFRESH_EXPIRY
      );

      console.log(`✅ Client login successful: ${email}`);
      
      return {
        user: {
          email: clientUser.email,
          status: clientUser.status
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('❌ Client authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Change admin password
   */
  async changeAdminPassword(email, currentPassword, newPassword) {
    try {
      const user = await this.collections.users.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      await this.collections.users.updateOne(
        { email },
        { 
          $set: { 
            password: hashedNewPassword,
            updated_at: new Date()
          }
        }
      );

      console.log(`🔐 Admin password changed: ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Admin password change failed:', error.message);
      throw error;
    }
  }

  /**
   * Create client password
   */
  async createClientPassword(token, password) {
    try {
      const decoded = this.authMiddleware.verifyToken(token);
      
      if (decoded.type !== 'client_password_setup') {
        throw new Error('Invalid token type');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update client user password
      await this.collections.clientUsers.updateOne(
        { email: decoded.email },
        { 
          $set: { 
            password: hashedPassword,
            status: 'active',
            password_set_at: new Date(),
            updated_at: new Date()
          }
        },
        { upsert: true }
      );

      console.log(`🔐 Client password created: ${decoded.email}`);
      return decoded.email;
    } catch (error) {
      console.error('❌ Client password creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Reset client password
   */
  async resetClientPassword(email, newPassword, resetToken = null) {
    try {
      let clientEmail = email;

      // If reset token provided, verify it
      if (resetToken) {
        const decoded = this.authMiddleware.verifyToken(resetToken);
        if (decoded.type !== 'client_password_reset') {
          throw new Error('Invalid reset token');
        }
        clientEmail = decoded.email;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await this.collections.clientUsers.updateOne(
        { email: clientEmail },
        { 
          $set: { 
            password: hashedPassword,
            password_reset_token: null,
            password_reset_expires: null,
            updated_at: new Date()
          }
        }
      );

      console.log(`🔐 Client password reset: ${clientEmail}`);
      return clientEmail;
    } catch (error) {
      console.error('❌ Client password reset failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(email, type = 'client_password_reset') {
    return this.authMiddleware.generateToken(
      { email, type },
      '1h' // 1 hour expiry for reset tokens
    );
  }

  /**
   * Generate password setup token
   */
  generatePasswordSetupToken(email, type = 'client_password_setup') {
    return this.authMiddleware.generateToken(
      { email, type },
      '7d' // 7 days expiry for setup tokens
    );
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    return this.authMiddleware.verifyToken(token);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = this.authMiddleware.verifyToken(refreshToken);
      
      // Generate new access token
      const newAccessToken = this.authMiddleware.generateToken(
        { 
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          type: decoded.type
        },
        process.env.JWT_ACCESS_EXPIRY
      );

      return newAccessToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
      throw error;
    }
  }
}

module.exports = AuthService;