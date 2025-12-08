const AuthService = require('../../../services/AuthService');
const bcrypt = require('bcryptjs');

// Mock bcrypt
jest.mock('bcryptjs');

describe('AuthService', () => {
  let authService;
  let mockAuthMiddleware;
  let mockCollections;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock AuthMiddleware
    mockAuthMiddleware = {
      generateToken: jest.fn((payload, expiry) => `mock_token_${payload.email}`),
      generateRefreshToken: jest.fn((payload, expiry) => `mock_refresh_${payload.email}`),
      verifyToken: jest.fn((token) => ({ email: 'test@example.com', type: 'client_password_setup' }))
    };

    // Mock Collections
    mockCollections = {
      users: {
        findOne: jest.fn(),
        updateOne: jest.fn()
      },
      clientUsers: {
        findOne: jest.fn(),
        updateOne: jest.fn()
      }
    };

    authService = new AuthService(mockAuthMiddleware, mockCollections);
  });

  describe('authenticateAdmin', () => {
    it('should successfully authenticate admin with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'admin@example.com',
        password: 'hashed_password',
        role: 'admin'
      };

      mockCollections.users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await authService.authenticateAdmin('admin@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('admin@example.com');
      expect(mockCollections.users.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should throw error for non-existent user', async () => {
      mockCollections.users.findOne.mockResolvedValue(null);

      await expect(
        authService.authenticateAdmin('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'admin@example.com',
        password: 'hashed_password',
        role: 'admin'
      };

      mockCollections.users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.authenticateAdmin('admin@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('authenticateClient', () => {
    it('should successfully authenticate client with valid credentials', async () => {
      const mockClientUser = {
        email: 'client@example.com',
        password: 'hashed_password',
        status: 'active'
      };

      mockCollections.clientUsers.findOne.mockResolvedValue(mockClientUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await authService.authenticateClient('client@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('client@example.com');
    });

    it('should throw error if password not set', async () => {
      const mockClientUser = {
        email: 'client@example.com',
        password: null,
        status: 'pending'
      };

      mockCollections.clientUsers.findOne.mockResolvedValue(mockClientUser);

      await expect(
        authService.authenticateClient('client@example.com', 'password123')
      ).rejects.toThrow('Password not set');
    });
  });

  describe('changeAdminPassword', () => {
    it('should successfully change admin password', async () => {
      const mockUser = {
        email: 'admin@example.com',
        password: 'old_hashed_password'
      };

      mockCollections.users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new_hashed_password');
      mockCollections.users.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await authService.changeAdminPassword(
        'admin@example.com',
        'oldpassword',
        'newpassword'
      );

      expect(result).toBe(true);
      expect(mockCollections.users.updateOne).toHaveBeenCalled();
    });

    it('should throw error for incorrect current password', async () => {
      const mockUser = {
        email: 'admin@example.com',
        password: 'old_hashed_password'
      };

      mockCollections.users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.changeAdminPassword('admin@example.com', 'wrongpassword', 'newpassword')
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('createClientPassword', () => {
    it('should successfully create client password with valid token', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockCollections.clientUsers.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await authService.createClientPassword('valid_token', 'newpassword123');

      expect(result).toBe('test@example.com');
      expect(mockAuthMiddleware.verifyToken).toHaveBeenCalledWith('valid_token');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(mockCollections.clientUsers.updateOne).toHaveBeenCalled();
    });

    it('should throw error for invalid token type', async () => {
      mockAuthMiddleware.verifyToken.mockReturnValue({ email: 'test@example.com', type: 'wrong_type' });

      await expect(
        authService.createClientPassword('invalid_token', 'newpassword123')
      ).rejects.toThrow('Invalid token type');
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate password reset token', () => {
      const token = authService.generatePasswordResetToken('test@example.com', 'client_password_reset');

      expect(token).toBe('mock_token_test@example.com');
      expect(mockAuthMiddleware.generateToken).toHaveBeenCalledWith(
        { email: 'test@example.com', type: 'client_password_reset' },
        '1h'
      );
    });
  });

  describe('generatePasswordSetupToken', () => {
    it('should generate password setup token', () => {
      const token = authService.generatePasswordSetupToken('test@example.com', 'client_password_setup');

      expect(token).toBe('mock_token_test@example.com');
      expect(mockAuthMiddleware.generateToken).toHaveBeenCalledWith(
        { email: 'test@example.com', type: 'client_password_setup' },
        '7d'
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      mockAuthMiddleware.verifyToken.mockReturnValue({
        id: 'user123',
        email: 'admin@example.com',
        role: 'admin'
      });

      const result = await authService.refreshToken('valid_refresh_token');

      expect(result).toBe('mock_token_admin@example.com');
      expect(mockAuthMiddleware.verifyToken).toHaveBeenCalledWith('valid_refresh_token');
    });

    it('should throw error for invalid refresh token', async () => {
      mockAuthMiddleware.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.refreshToken('invalid_token')
      ).rejects.toThrow();
    });
  });
});
