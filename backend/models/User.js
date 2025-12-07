/**
 * User Model - Data access layer for admin users
 * Implements Single Responsibility Principle - only data operations
 */

class UserModel {
  constructor(collections) {
    this.users = collections.users;
  }

  /**
   * Create a new admin user
   */
  async create(userData) {
    try {
      const result = await this.users.insertOne(userData);
      return { ...userData, _id: result.insertedId };
    } catch (error) {
      console.error('❌ User creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      return await this.users.findOne({ email }, { _id: 0 });
    } catch (error) {
      console.error('❌ User lookup failed:', error.message);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      return await this.users.findOne({ _id: id });
    } catch (error) {
      console.error('❌ User lookup by ID failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async findAll() {
    try {
      return await this.users.find({}, { _id: 0, password: 0 }).toArray();
    } catch (error) {
      console.error('❌ Users retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateByEmail(email, updateData) {
    try {
      const result = await this.users.updateOne(
        { email },
        { 
          $set: { 
            ...updateData,
            updated_at: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ User update failed:', error.message);
      throw error;
    }
  }

  /**
   * Update password
   */
  async updatePassword(email, hashedPassword) {
    try {
      const result = await this.users.updateOne(
        { email },
        { 
          $set: { 
            password: hashedPassword,
            password_changed_at: new Date(),
            updated_at: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ User password update failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteByEmail(email) {
    try {
      const result = await this.users.deleteOne({ email });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ User deletion failed:', error.message);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async findByRole(role) {
    try {
      return await this.users.find({ role }, { _id: 0, password: 0 }).toArray();
    } catch (error) {
      console.error('❌ Users by role retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getStats() {
    try {
      const totalUsers = await this.users.countDocuments();
      const adminUsers = await this.users.countDocuments({ role: 'admin' });
      const managerUsers = await this.users.countDocuments({ role: 'manager' });

      return {
        total: totalUsers,
        admin: adminUsers,
        manager: managerUsers
      };
    } catch (error) {
      console.error('❌ User stats retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if user exists
   */
  async exists(email) {
    try {
      const count = await this.users.countDocuments({ email });
      return count > 0;
    } catch (error) {
      console.error('❌ User existence check failed:', error.message);
      throw error;
    }
  }

  /**
   * Count total users
   */
  async count() {
    try {
      return await this.users.countDocuments();
    } catch (error) {
      console.error('❌ User count failed:', error.message);
      throw error;
    }
  }
}

module.exports = UserModel;