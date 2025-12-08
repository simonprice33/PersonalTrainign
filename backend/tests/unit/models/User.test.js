const UserModel = require('../../../models/User');

describe('UserModel', () => {
  let userModel;
  let mockUsersCollection;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsersCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn()
    };

    userModel = new UserModel({ users: mockUsersCollection });
  });

  describe('create', () => {
    it('should successfully create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'admin'
      };

      mockUsersCollection.insertOne.mockResolvedValue({
        insertedId: 'user123'
      });

      const result = await userModel.create(userData);

      expect(result).toHaveProperty('_id', 'user123');
      expect(result.email).toBe('test@example.com');
      expect(mockUsersCollection.insertOne).toHaveBeenCalledWith(userData);
    });

    it('should throw error when creation fails', async () => {
      mockUsersCollection.insertOne.mockRejectedValue(new Error('Database error'));

      await expect(
        userModel.create({ email: 'test@example.com' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const result = await userModel.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUsersCollection.findOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        { _id: 0 }
      );
    });

    it('should return null when user not found', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);

      const result = await userModel.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        { email: 'user1@example.com', name: 'User 1', role: 'admin' },
        { email: 'user2@example.com', name: 'User 2', role: 'manager' }
      ];

      mockUsersCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockUsers)
      });

      const result = await userModel.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockUsersCollection.find).toHaveBeenCalledWith(
        {},
        { _id: 0, password: 0 }
      );
    });
  });

  describe('updateByEmail', () => {
    it('should successfully update user', async () => {
      mockUsersCollection.updateOne.mockResolvedValue({
        modifiedCount: 1
      });

      const result = await userModel.updateByEmail('test@example.com', {
        name: 'Updated Name'
      });

      expect(result).toBe(true);
      expect(mockUsersCollection.updateOne).toHaveBeenCalled();
    });

    it('should return false when no user updated', async () => {
      mockUsersCollection.updateOne.mockResolvedValue({
        modifiedCount: 0
      });

      const result = await userModel.updateByEmail('nonexistent@example.com', {
        name: 'Updated Name'
      });

      expect(result).toBe(false);
    });
  });

  describe('deleteByEmail', () => {
    it('should successfully delete user', async () => {
      mockUsersCollection.deleteOne.mockResolvedValue({
        deletedCount: 1
      });

      const result = await userModel.deleteByEmail('test@example.com');

      expect(result).toBe(true);
      expect(mockUsersCollection.deleteOne).toHaveBeenCalledWith({
        email: 'test@example.com'
      });
    });

    it('should return false when no user deleted', async () => {
      mockUsersCollection.deleteOne.mockResolvedValue({
        deletedCount: 0
      });

      const result = await userModel.deleteByEmail('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const mockAdmins = [
        { email: 'admin1@example.com', name: 'Admin 1', role: 'admin' },
        { email: 'admin2@example.com', name: 'Admin 2', role: 'admin' }
      ];

      mockUsersCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockAdmins)
      });

      const result = await userModel.findByRole('admin');

      expect(result).toEqual(mockAdmins);
      expect(mockUsersCollection.find).toHaveBeenCalledWith(
        { role: 'admin' },
        { _id: 0, password: 0 }
      );
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      mockUsersCollection.countDocuments
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(5)   // admin
        .mockResolvedValueOnce(3);  // manager

      const result = await userModel.getStats();

      expect(result).toEqual({
        total: 10,
        admin: 5,
        manager: 3
      });
    });
  });

  describe('exists', () => {
    it('should return true when user exists', async () => {
      mockUsersCollection.countDocuments.mockResolvedValue(1);

      const result = await userModel.exists('test@example.com');

      expect(result).toBe(true);
      expect(mockUsersCollection.countDocuments).toHaveBeenCalledWith({
        email: 'test@example.com'
      });
    });

    it('should return false when user does not exist', async () => {
      mockUsersCollection.countDocuments.mockResolvedValue(0);

      const result = await userModel.exists('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return total user count', async () => {
      mockUsersCollection.countDocuments.mockResolvedValue(25);

      const result = await userModel.count();

      expect(result).toBe(25);
      expect(mockUsersCollection.countDocuments).toHaveBeenCalled();
    });
  });
});
