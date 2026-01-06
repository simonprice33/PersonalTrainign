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
    
    // Trust proxy for production (behind nginx/load balancer)
    if (process.env.NODE_ENV === 'production') {
      app.set('trust proxy', 1); // Trust first proxy
      console.log('✅ Trust proxy enabled for production');
    }
    
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

    // Rate limiting - balanced for production use
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs || 15 * 60 * 1000, // 15 minutes
      max: config.rateLimit.maxRequests || 200, // 200 requests per window
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true, // Return rate limit info in headers
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health' || req.path === '/health';
      }
    });
    
    // Only apply rate limiting in production
    if (process.env.NODE_ENV === 'production') {
      app.use('/api/', limiter);
    } else {
      console.log('⚠️  Rate limiting disabled in development mode');
    }

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

    // 7. Load Routes
    const createPublicRoutes = require('./routes/public');
    const createAdminRoutes = require('./routes/admin');
    const createClientRoutes = require('./routes/client');
    const createWebhookRoutes = require('./routes/webhooks');
    const createPackageRoutes = require('./routes/packages');

    // Route dependencies
    const routeDependencies = {
      db,
      collections,
      stripe,
      stripeConfig,
      emailConfig,
      authMiddleware,
      config
    };

    // Special handling for webhook endpoint (needs raw body)
    app.use('/api/webhooks', express.raw({ type: 'application/json' }), createWebhookRoutes(routeDependencies));

    // Public routes (no auth)
    app.use('/api', createPublicRoutes(routeDependencies));

    // Admin routes
    app.use('/api/admin', createAdminRoutes(routeDependencies));

    // Client routes
    app.use('/api/client', createClientRoutes(routeDependencies));

    // Portal session endpoint (can be used by both admin and client)
    app.post('/api/create-portal-session', authMiddleware.authenticate, async (req, res) => {
      try {
        const userEmail = req.user.email;
        const client = await collections.clients.findOne({ email: userEmail }, { _id: 0 });
        
        if (!client) {
          return res.status(404).json({
            success: false,
            message: 'Client not found'
          });
        }

        if (!client.customer_id) {
          return res.status(400).json({
            success: false,
            message: 'No Stripe customer found'
          });
        }

        const session = await stripe.billingPortal.sessions.create({
          customer: client.customer_id,
          return_url: `${config.frontendUrl}/admin/clients`
        });

        res.status(200).json({
          success: true,
          url: session.url
        });

      } catch (error) {
        console.error('❌ Create portal session error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create portal session'
        });
      }
    });

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