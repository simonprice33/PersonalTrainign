const AuthMiddleware = require('../../../middleware/auth');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('AuthMiddleware', () => {
  let authMiddleware;
  const testSecret = 'test_jwt_secret';

  beforeEach(() => {
    jest.clearAllMocks();
    authMiddleware = new AuthMiddleware(testSecret);
  });

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const payload = { email: 'test@example.com', role: 'admin' };
      const expiresIn = '15m';

      jwt.sign.mockReturnValue('mock_token');

      const token = authMiddleware.generateToken(payload, expiresIn);

      expect(token).toBe('mock_token');
      expect(jwt.sign).toHaveBeenCalledWith(payload, testSecret, { expiresIn });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const payload = { email: 'test@example.com' };
      const expiresIn = '7d';

      jwt.sign.mockReturnValue('mock_refresh_token');

      const token = authMiddleware.generateRefreshToken(payload, expiresIn);

      expect(token).toBe('mock_refresh_token');
      expect(jwt.sign).toHaveBeenCalledWith(payload, testSecret, { expiresIn });
    });
  });

  describe('authenticateAdminToken', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should authenticate valid admin token', () => {
      mockReq.headers.authorization = 'Bearer valid_token';
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { email: 'admin@example.com', role: 'admin' });
      });

      authMiddleware.authenticateAdminToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({ email: 'admin@example.com', role: 'admin' });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', () => {
      authMiddleware.authenticateAdminToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      mockReq.headers.authorization = 'Bearer invalid_token';
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      authMiddleware.authenticateAdminToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-admin token', () => {
      mockReq.headers.authorization = 'Bearer client_token';
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { email: 'client@example.com', role: 'client' });
      });

      authMiddleware.authenticateAdminToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authenticateClientToken', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should authenticate valid client token', () => {
      mockReq.headers.authorization = 'Bearer valid_client_token';
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { email: 'client@example.com', type: 'client' });
      });

      authMiddleware.authenticateClientToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({ email: 'client@example.com', type: 'client' });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject token without client type', () => {
      mockReq.headers.authorization = 'Bearer admin_token';
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { email: 'admin@example.com', role: 'admin' });
      });

      authMiddleware.authenticateClientToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token type - client access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify and return decoded token', () => {
      const mockDecoded = { email: 'test@example.com', type: 'password_reset' };
      jwt.verify.mockReturnValue(mockDecoded);

      const result = authMiddleware.verifyToken('valid_token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', testSecret);
    });

    it('should throw error for invalid token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => {
        authMiddleware.verifyToken('invalid_token');
      }).toThrow('Invalid token');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const mockDecoded = { email: 'test@example.com' };
      jwt.decode.mockReturnValue(mockDecoded);

      const result = authMiddleware.decodeToken('some_token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.decode).toHaveBeenCalledWith('some_token');
    });
  });

  describe('authenticate (alias)', () => {
    it('should call authenticateAdminToken', () => {
      const mockReq = { headers: { authorization: 'Bearer token' } };
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { email: 'admin@example.com', role: 'admin' });
      });

      authMiddleware.authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authenticateClient (alias)', () => {
    it('should call authenticateClientToken', () => {
      const mockReq = { headers: { authorization: 'Bearer token' } };
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { email: 'client@example.com', type: 'client' });
      });

      authMiddleware.authenticateClient(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
