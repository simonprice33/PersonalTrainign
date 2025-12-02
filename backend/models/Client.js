/**
 * Client Model - Data access layer for clients
 * Implements Single Responsibility Principle - only data operations
 */

class ClientModel {
  constructor(collections) {
    this.clients = collections.clients;
    this.clientUsers = collections.clientUsers;
  }

  /**
   * Create a new client
   */
  async create(clientData) {
    try {
      const result = await this.clients.insertOne(clientData);
      return { ...clientData, _id: result.insertedId };
    } catch (error) {
      console.error('❌ Client creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Find client by email
   */
  async findByEmail(email) {
    try {
      return await this.clients.findOne({ email }, { _id: 0 });
    } catch (error) {
      console.error('❌ Client lookup failed:', error.message);
      throw error;
    }
  }

  /**
   * Find client by Stripe customer ID
   */
  async findByStripeCustomerId(stripeCustomerId) {
    try {
      return await this.clients.findOne({ stripe_customer_id: stripeCustomerId }, { _id: 0 });
    } catch (error) {
      console.error('❌ Client lookup by Stripe ID failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all clients
   */
  async findAll() {
    try {
      return await this.clients.find({}, { _id: 0 }).toArray();
    } catch (error) {
      console.error('❌ Clients retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Update client
   */
  async updateByEmail(email, updateData) {
    try {
      const result = await this.clients.updateOne(
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
      console.error('❌ Client update failed:', error.message);
      throw error;
    }
  }

  /**
   * Update client by Stripe customer ID
   */
  async updateByStripeCustomerId(stripeCustomerId, updateData) {
    try {
      const result = await this.clients.updateOne(
        { stripe_customer_id: stripeCustomerId },
        { 
          $set: { 
            ...updateData,
            updated_at: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ Client update by Stripe ID failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete client
   */
  async deleteByEmail(email) {
    try {
      const result = await this.clients.deleteOne({ email });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ Client deletion failed:', error.message);
      throw error;
    }
  }

  /**
   * Get clients by status
   */
  async findByStatus(status) {
    try {
      return await this.clients.find({ status }, { _id: 0 }).toArray();
    } catch (error) {
      console.error('❌ Clients by status retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get clients with payment failures
   */
  async findWithPaymentFailures(minFailures = 1) {
    try {
      return await this.clients.find({ 
        payment_failure_count: { $gte: minFailures }
      }, { _id: 0 }).toArray();
    } catch (error) {
      console.error('❌ Clients with payment failures retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get client statistics
   */
  async getStats() {
    try {
      const totalClients = await this.clients.countDocuments();
      const activeClients = await this.clients.countDocuments({ status: 'active' });
      const pendingClients = await this.clients.countDocuments({ status: 'pending' });
      const suspendedClients = await this.clients.countDocuments({ status: 'suspended' });
      const cancelledClients = await this.clients.countDocuments({ status: 'cancelled' });

      return {
        total: totalClients,
        active: activeClients,
        pending: pendingClients,
        suspended: suspendedClients,
        cancelled: cancelledClients
      };
    } catch (error) {
      console.error('❌ Client stats retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if client exists
   */
  async exists(email) {
    try {
      const count = await this.clients.countDocuments({ email });
      return count > 0;
    } catch (error) {
      console.error('❌ Client existence check failed:', error.message);
      throw error;
    }
  }

  /**
   * Bulk update clients
   */
  async bulkUpdate(filter, updateData) {
    try {
      const result = await this.clients.updateMany(
        filter,
        { 
          $set: { 
            ...updateData,
            updated_at: new Date()
          }
        }
      );
      return result.modifiedCount;
    } catch (error) {
      console.error('❌ Bulk client update failed:', error.message);
      throw error;
    }
  }
}

module.exports = ClientModel;