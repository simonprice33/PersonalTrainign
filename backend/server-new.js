#!/usr/bin/env node

/**
 * Simon Price PT Backend Server
 * Refactored using SOLID principles for maintainability and scalability
 */

require('dotenv').config();

// Import configuration modules
const EnvironmentConfig = require('./config/environment');
const DatabaseConfig = require('./config/database');
const StripeConfig = require('./config/stripe');
const EmailConfig = require('./config/email');

// Import middleware
const AuthMiddleware = require('./middleware/auth');
const ErrorHandler = require('./middleware/errorHandler');

// Express setup
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

async function startServer() {
  try {
    // 1. Validate Environment
    const envConfig = new EnvironmentConfig();
    envConfig.validate(); // Exits if validation fails
    const config = envConfig.getConfig();

    // 2. Initialize Express App
    const app = express();
    
    // Security middleware
    app.use(helmet({
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    const corsOptions = {
      origin: function (origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    };
    
    app.use(cors(corsOptions));
    app.options('/api/*', cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      }
    });
    app.use('/api/', limiter);

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 3. Initialize Database
    const dbConfig = new DatabaseConfig(config);
    const { db, collections } = await dbConfig.connect();
    await dbConfig.initializeAdminUser(collections);

    // 4. Initialize Services
    const stripeConfig = new StripeConfig(config);
    const stripe = stripeConfig.initialize();

    const emailConfig = new EmailConfig(config);
    const emailService = emailConfig.initialize();

    // 5. Initialize Authentication Middleware
    const authMiddleware = new AuthMiddleware(config.jwtSecret);

    // 6. Make services available to routes
    app.locals.db = db;
    app.locals.collections = collections;
    app.locals.stripe = stripe;
    app.locals.stripeConfig = stripeConfig;
    app.locals.emailConfig = emailConfig;
    app.locals.authMiddleware = authMiddleware;
    app.locals.config = config;

    // 7. Load Routes (TODO: Implement route modules)
    // const adminRoutes = require('./routes/admin');
    // const clientRoutes = require('./routes/client');
    // const webhookRoutes = require('./routes/webhooks');
    
    // app.use('/api/admin', adminRoutes);
    // app.use('/api/client', clientRoutes);
    // app.use('/api/webhooks', webhookRoutes);

    // Temporary: Keep existing monolithic routes for now
    // TODO: This will be replaced with modular routes
    const legacyRoutes = require('./legacy/routes');
    legacyRoutes(app);

    // 8. Error Handling
    app.use(ErrorHandler.notFound);
    app.use(ErrorHandler.handle);

    // 9. Start Server
    app.listen(config.port, () => {
      console.log('='.repeat(60));
      console.log(`🚀 Simon Price PT Backend running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📧 Email: ${emailConfig.getStatus().configured ? 'Configured' : 'Disabled'}`);
      console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
      console.log(`🔗 CORS origins: ${config.corsOrigins.join(', ')}`);
      console.log(`💾 Database: Connected to ${config.dbName}`);
      console.log(`💳 Stripe: ${stripeConfig.getStatus().configured ? `Configured (${stripeConfig.getStatus().mode})` : 'Disabled'}`);
      console.log('='.repeat(60));
      console.log('✅ Server is ready to accept requests');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();