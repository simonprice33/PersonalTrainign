/**
 * ClientUser Model - Data access layer for client users
 * Implements Single Responsibility Principle - only data operations
 */

class ClientUserModel {
  constructor(collections) {
    this.clientUsers = collections.clientUsers;
  }

  /**
   * Create a new client user
   */
  async create(clientUserData) {
    try {
      const result = await this.clientUsers.insertOne(clientUserData);
      return { ...clientUserData, _id: result.insertedId };
    } catch (error) {
      console.error('❌ Client user creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Find client user by email
   */
  async findByEmail(email) {
    try {
      return await this.clientUsers.findOne({ email }, { _id: 0 });
    } catch (error) {
      console.error('❌ Client user lookup failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all client users
   */
  async findAll() {
    try {
      return await this.clientUsers.find({}, { _id: 0 }).toArray();
    } catch (error) {
      console.error('❌ Client users retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Update client user
   */
  async updateByEmail(email, updateData) {
    try {
      const result = await this.clientUsers.updateOne(
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
      console.error('❌ Client user update failed:', error.message);
      throw error;
    }
  }

  /**
   * Update password
   */
  async updatePassword(email, hashedPassword) {
    try {
      const result = await this.clientUsers.updateOne(
        { email },
        { 
          $set: { 
            password: hashedPassword,
            password_set_at: new Date(),
            updated_at: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ Client user password update failed:', error.message);
      throw error;
    }
  }

  /**
   * Update status
   */
  async updateStatus(email, status) {
    try {
      const result = await this.clientUsers.updateOne(
        { email },
        { 
          $set: { 
            status,
            updated_at: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ Client user status update failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete client user
   */
  async deleteByEmail(email) {
    try {
      const result = await this.clientUsers.deleteOne({ email });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ Client user deletion failed:', error.message);
      throw error;
    }
  }

  /**
   * Get client users by status
   */
  async findByStatus(status) {
    try {
      return await this.clientUsers.find({ status }, { _id: 0 }).toArray();
    } catch (error) {
      console.error('❌ Client users by status retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get client users without passwords
   */
  async findWithoutPassword() {
    try {
      return await this.clientUsers.find({ 
        $or: [
          { password: null },
          { password: { $exists: false } }
        ]
      }, { _id: 0 }).toArray();
    } catch (error) {
      console.error('❌ Client users without password retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get client user statistics
   */
  async getStats() {
    try {
      const totalUsers = await this.clientUsers.countDocuments();
      const activeUsers = await this.clientUsers.countDocuments({ status: 'active' });
      const pendingUsers = await this.clientUsers.countDocuments({ status: 'pending' });
      const suspendedUsers = await this.clientUsers.countDocuments({ status: 'suspended' });
      const cancelledUsers = await this.clientUsers.countDocuments({ status: 'cancelled' });
      const usersWithPassword = await this.clientUsers.countDocuments({ 
        password: { $ne: null, $exists: true }
      });

      return {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        suspended: suspendedUsers,
        cancelled: cancelledUsers,
        withPassword: usersWithPassword,
        withoutPassword: totalUsers - usersWithPassword
      };
    } catch (error) {
      console.error('❌ Client user stats retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if client user exists
   */
  async exists(email) {
    try {
      const count = await this.clientUsers.countDocuments({ email });
      return count > 0;
    } catch (error) {
      console.error('❌ Client user existence check failed:', error.message);
      throw error;
    }
  }

  /**
   * Upsert client user (create or update)
   */
  async upsert(email, clientUserData) {
    try {
      const result = await this.clientUsers.updateOne(
        { email },
        { 
          $set: { 
            ...clientUserData,
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
      return result.upsertedCount > 0 || result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ Client user upsert failed:', error.message);
      throw error;
    }
  }
}

module.exports = ClientUserModel;