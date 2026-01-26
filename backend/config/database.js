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
        healthQuestions: this.db.collection('health_questions'),
        blogPosts: this.db.collection('blog_posts'),
        blogCategories: this.db.collection('blog_categories'),
        blogTags: this.db.collection('blog_tags'),
        cancellationPolicy: this.db.collection('cancellation_policy'),
        termsOfService: this.db.collection('terms_of_service'),
        privacyPolicy: this.db.collection('privacy_policy'),
        cookiePolicy: this.db.collection('cookie_policy'),
        homepageContent: this.db.collection('homepage_content')
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

      // Packages collection indexes
      await this.collections.packages.createIndex({ active: 1 });
      console.log('✅ Packages indexes created');

      // PARQ questions collection indexes
      await this.collections.parqQuestions.createIndex({ order: 1 });
      console.log('✅ PARQ questions indexes created');

      // Health questions collection indexes
      await this.collections.healthQuestions.createIndex({ order: 1 });
      console.log('✅ Health questions indexes created');

      // Blog posts collection indexes
      await this.collections.blogPosts.createIndex({ slug: 1 }, { unique: true });
      await this.collections.blogPosts.createIndex({ status: 1, publish_date: -1 });
      await this.collections.blogPosts.createIndex({ category_slug: 1 });
      await this.collections.blogPosts.createIndex({ tags: 1 });
      console.log('✅ Blog posts indexes created');

      // Blog categories collection indexes
      await this.collections.blogCategories.createIndex({ slug: 1 }, { unique: true });
      console.log('✅ Blog categories indexes created');

      // Blog tags collection indexes
      await this.collections.blogTags.createIndex({ slug: 1 }, { unique: true });
      console.log('✅ Blog tags indexes created');

      // Cancellation policy collection indexes
      await this.collections.cancellationPolicy.createIndex({ order: 1 });
      await this.collections.termsOfService.createIndex({ order: 1 });
      await this.collections.privacyPolicy.createIndex({ order: 1 });
      await this.collections.cookiePolicy.createIndex({ order: 1 });
      console.log('✅ Cancellation policy indexes created');

      // Seed initial data
      await this._seedInitialData();

    } catch (error) {
      console.error('❌ Index creation failed:', error.message);
      // Don't throw - indexes are not critical for functionality
    }
  }

  /**
   * Seed initial data for packages and questions
   * @private
   */
  async _seedInitialData() {
    try {
      // Seed packages if empty
      const packageCount = await this.collections.packages.countDocuments();
      if (packageCount === 0) {
        await this.collections.packages.insertMany([
          {
            id: 'nutrition-only',
            name: 'Nutrition Only',
            price: 75,
            description: 'Personalized nutrition coaching and meal planning',
            features: [
              'Custom meal plans',
              'Nutrition tracking',
              'Weekly check-ins',
              'Email support'
            ],
            active: true,
            created_at: new Date()
          },
          {
            id: 'pt-with-nutrition',
            name: 'Personal Training with Nutrition',
            price: 125,
            description: 'Complete fitness and nutrition transformation',
            features: [
              'Personal training sessions',
              'Custom meal plans',
              'Nutrition tracking',
              'Weekly check-ins',
              'Priority support',
              'Workout programming'
            ],
            active: true,
            created_at: new Date()
          }
        ]);
        console.log('✅ Seeded default packages');
      }

      // Seed PARQ questions if empty
      const parqCount = await this.collections.parqQuestions.countDocuments();
      if (parqCount === 0) {
        await this.collections.parqQuestions.insertMany([
          {
            id: 'parq-1',
            question: 'Has your doctor ever said that you have a heart condition?',
            order: 1,
            requires_doctor_approval: true,
            applicable_packages: ['pt-with-nutrition'],
            active: true,
            created_at: new Date()
          },
          {
            id: 'parq-2',
            question: 'Do you feel pain in your chest when you do physical activity?',
            order: 2,
            requires_doctor_approval: true,
            applicable_packages: ['pt-with-nutrition'],
            active: true,
            created_at: new Date()
          },
          {
            id: 'parq-3',
            question: 'Do you lose your balance because of dizziness or do you ever lose consciousness?',
            order: 3,
            requires_doctor_approval: true,
            applicable_packages: ['pt-with-nutrition'],
            active: true,
            created_at: new Date()
          },
          {
            id: 'parq-4',
            question: 'Do you have a bone or joint problem that could be made worse by physical activity?',
            order: 4,
            requires_doctor_approval: true,
            applicable_packages: ['pt-with-nutrition'],
            active: true,
            created_at: new Date()
          },
          {
            id: 'parq-5',
            question: 'Are you currently taking medication for blood pressure or a heart condition?',
            order: 5,
            requires_doctor_approval: true,
            applicable_packages: ['pt-with-nutrition'],
            active: true,
            created_at: new Date()
          }
        ]);
        console.log('✅ Seeded default PARQ questions (PT with Nutrition only)');
      } else {
        // Migrate existing PARQ questions to have applicable_packages if not set
        const updateResult = await this.collections.parqQuestions.updateMany(
          { applicable_packages: { $exists: false } },
          { $set: { applicable_packages: ['pt-with-nutrition'] } }
        );
        if (updateResult.modifiedCount > 0) {
          console.log(`✅ Migrated ${updateResult.modifiedCount} PARQ questions to PT with Nutrition only`);
        }
      }

      // Seed health questions if empty
      const healthCount = await this.collections.healthQuestions.countDocuments();
      if (healthCount === 0) {
        await this.collections.healthQuestions.insertMany([
          {
            id: 'health-1',
            question: 'Do you have any current injuries or physical limitations?',
            type: 'text',
            options: [],
            order: 1,
            active: true,
            created_at: new Date()
          },
          {
            id: 'health-2',
            question: 'What is your current activity level?',
            type: 'multiple_choice',
            options: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'],
            order: 2,
            active: true,
            created_at: new Date()
          },
          {
            id: 'health-3',
            question: 'Do you have any dietary restrictions or allergies?',
            type: 'text',
            options: [],
            order: 3,
            active: true,
            created_at: new Date()
          }
        ]);
        console.log('✅ Seeded default health questions');
      }

    } catch (error) {
      console.error('❌ Data seeding failed:', error.message);
      // Don't throw - seeding failure is not critical
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