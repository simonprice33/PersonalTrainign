/**
 * Database Configuration and Connection
 * Implements Single Responsibility Principle - handles only database operations
 */

const { MongoClient } = require('mongodb');

class DatabaseConfig {
  constructor(config) {
    this.mongoUrl = config.mongoUrl;
    this.dbName = config.dbName;
    this.db = null;
    this.collections = {};
  }

  /**
   * Connect to MongoDB and initialize collections
   * @returns {Promise<Object>} Database instance and collections
   */
  async connect() {
    try {
      console.log('📦 Connecting to MongoDB...');
      const client = await MongoClient.connect(this.mongoUrl);
      this.db = client.db(this.dbName);
      
      // Initialize collections
      await this._initializeCollections();
      
      console.log('✅ Connected to MongoDB');
      console.log(`📊 Database: ${this.dbName}`);
      
      return {
        db: this.db,
        collections: this.collections
      };
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Initialize collections and create indexes
   * @private
   */
  async _initializeCollections() {
    try {
      // Initialize collections
      this.collections = {
        users: this.db.collection('users'),
        mailingList: this.db.collection('mailing_list'),
        contacts: this.db.collection('contacts'),
        tdeeResults: this.db.collection('tdee_results'),
        clients: this.db.collection('clients'),
        clientUsers: this.db.collection('client_users'),
        packages: this.db.collection('packages'),
        parqQuestions: this.db.collection('parq_questions'),
        healthQuestions: this.db.collection('health_questions')
      };

      // Create indexes for better performance
      await this._createIndexes();
      
      console.log('📚 Collections initialized');
    } catch (error) {
      console.error('❌ Collection initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Create database indexes
   * @private
   */
  async _createIndexes() {
    try {
      // Users collection indexes
      await this.collections.users.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Users index created');

      // Mailing list indexes
      await this.collections.mailingList.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Email index created');

      // Contacts collection indexes
      await this.collections.contacts.createIndex({ email: 1 });
      await this.collections.contacts.createIndex({ created_at: -1 });
      console.log('✅ Contacts indexes created');

      // TDEE results collection indexes
      await this.collections.tdeeResults.createIndex({ email: 1 });
      await this.collections.tdeeResults.createIndex({ created_at: -1 });
      console.log('✅ TDEE results indexes created');

      // Clients collection indexes
      await this.collections.clients.createIndex({ email: 1 }, { unique: true });
      await this.collections.clients.createIndex({ stripe_customer_id: 1 }, { unique: true, sparse: true });
      console.log('✅ Clients indexes created');

      // Client users collection indexes
      await this.collections.clientUsers.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Client users indexes created');

    } catch (error) {
      console.error('❌ Index creation failed:', error.message);
      // Don't throw - indexes are not critical for functionality
    }
  }

  /**
   * Initialize admin user if none exists
   * @param {Object} collections Database collections
   */
  async initializeAdminUser(collections) {
    try {
      const existingAdminCount = await collections.users.countDocuments();
      
      if (existingAdminCount === 0) {
        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('Qwerty1234!!!', 10);
        
        const adminUser = {
          email: 'simon.price@simonprice-pt.co.uk',
          password: adminPassword,
          role: 'admin',
          created_at: new Date()
        };
        
        await collections.users.insertOne(adminUser);
        console.log('👑 Default admin user created: simon.price@simonprice-pt.co.uk');
        console.log('🔐 Default password: Qwerty1234!!!');
        console.log('⚠️  Please change this password after first login');
      } else {
        console.log(`ℹ️  Found ${existingAdminCount} admin user(s) in database`);
      }
    } catch (error) {
      console.error('❌ Admin user initialization failed:', error.message);
      // Don't throw - this is not critical for startup
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const stats = await Promise.all([
        this.collections.users.countDocuments(),
        this.collections.mailingList.countDocuments(),
        this.collections.clients.countDocuments(),
        this.collections.clientUsers.countDocuments()
      ]);

      return {
        users: stats[0],
        mailingList: stats[1],
        clients: stats[2],
        clientUsers: stats[3],
        total: stats.reduce((sum, count) => sum + count, 0)
      };
    } catch (error) {
      console.error('❌ Failed to get database stats:', error.message);
      return null;
    }
  }
}

module.exports = DatabaseConfig;