/**
 * Environment Configuration and Validation
 * Implements Single Responsibility Principle - handles only environment validation
 */

class EnvironmentConfig {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate all environment variables
   * @returns {boolean} True if validation passes
   */
  validate() {
    console.log('🔍 Validating environment variables...\n');
    
    this._validateRequired();
    this._validateOptional();
    this._validateConsistency();
    
    return this._displayResults();
  }

  /**
   * Validate required environment variables
   * @private
   */
  _validateRequired() {
    const required = {
      'MONGO_URL': {
        value: process.env.MONGO_URL,
        description: 'MongoDB connection string',
        validator: (val) => val && val.startsWith('mongodb://')
      },
      'DB_NAME': {
        value: process.env.DB_NAME,
        description: 'MongoDB database name',
        validator: (val) => val && val.length > 0
      },
      'JWT_SECRET': {
        value: process.env.JWT_SECRET,
        description: 'JWT signing secret key',
        validator: (val) => val && val.length >= 32
      },
      'JWT_ACCESS_EXPIRY': {
        value: process.env.JWT_ACCESS_EXPIRY,
        description: 'JWT access token expiry time',
        validator: (val) => val && /^\d+[mhd]$/.test(val)
      },
      'JWT_REFRESH_EXPIRY': {
        value: process.env.JWT_REFRESH_EXPIRY,
        description: 'JWT refresh token expiry time',
        validator: (val) => val && /^\d+[mhd]$/.test(val)
      },
      'FRONTEND_URL': {
        value: process.env.FRONTEND_URL,
        description: 'Frontend URL for email links',
        validator: (val) => val && (val.startsWith('http://') || val.startsWith('https://'))
      },
      'CORS_ORIGINS': {
        value: process.env.CORS_ORIGINS,
        description: 'Allowed CORS origins',
        validator: (val) => val && val.length > 0
      }
    };

    console.log('📋 Required Environment Variables:');
    Object.entries(required).forEach(([key, config]) => {
      const { value, description, validator } = config;
      
      if (!value) {
        this.errors.push(`❌ ${key}: Missing (${description})`);
        console.log(`   ❌ ${key}: MISSING`);
      } else if (validator && !validator(value)) {
        this.errors.push(`❌ ${key}: Invalid format (${description})`);
        console.log(`   ❌ ${key}: INVALID FORMAT`);
      } else {
        console.log(`   ✅ ${key}: OK`);
      }
    });
  }

  /**
   * Validate optional environment variables
   * @private
   */
  _validateOptional() {
    const optional = {
      'STRIPE_SECRET_KEY': {
        value: process.env.STRIPE_SECRET_KEY,
        description: 'Stripe secret key for payments',
        validator: (val) => !val || (val.startsWith('sk_test_') || val.startsWith('sk_live_'))
      },
      'STRIPE_PUBLISHABLE_KEY': {
        value: process.env.STRIPE_PUBLISHABLE_KEY,
        description: 'Stripe publishable key',
        validator: (val) => !val || (val.startsWith('pk_test_') || val.startsWith('pk_live_'))
      },
      'STRIPE_WEBHOOK_SECRET': {
        value: process.env.STRIPE_WEBHOOK_SECRET,
        description: 'Stripe webhook endpoint secret',
        validator: (val) => !val || val.startsWith('whsec_')
      }
    };

    console.log('\n📋 Optional Environment Variables:');
    Object.entries(optional).forEach(([key, config]) => {
      const { value, description, validator } = config;
      
      if (!value) {
        this.warnings.push(`⚠️  ${key}: Not set (${description})`);
        console.log(`   ⚠️  ${key}: NOT SET`);
      } else if (validator && !validator(value)) {
        this.warnings.push(`⚠️  ${key}: Invalid format (${description})`);
        console.log(`   ⚠️  ${key}: INVALID FORMAT`);
      } else {
        console.log(`   ✅ ${key}: OK`);
      }
    });
  }

  /**
   * Validate environment consistency
   * @private
   */
  _validateConsistency() {
    console.log('\n🔍 Environment Consistency Checks:');
    
    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`   📍 NODE_ENV: ${nodeEnv}`);
    
    // Stripe key consistency
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const stripePublic = process.env.STRIPE_PUBLISHABLE_KEY;
    if (stripeSecret && stripePublic) {
      const secretIsTest = stripeSecret.startsWith('sk_test_');
      const publicIsTest = stripePublic.startsWith('pk_test_');
      
      if (secretIsTest !== publicIsTest) {
        this.warnings.push('⚠️  Stripe key mismatch: Secret and publishable keys are not both test or both live');
        console.log('   ⚠️  STRIPE: Key type mismatch (test vs live)');
      } else {
        console.log(`   ✅ STRIPE: Keys are consistent (${secretIsTest ? 'test' : 'live'} mode)`);
      }
    }
    
    // CORS configuration
    const corsOrigins = process.env.CORS_ORIGINS;
    const frontendUrl = process.env.FRONTEND_URL;
    if (corsOrigins && frontendUrl && !corsOrigins.includes(frontendUrl)) {
      this.warnings.push('⚠️  FRONTEND_URL not included in CORS_ORIGINS');
      console.log('   ⚠️  CORS: Frontend URL not in allowed origins');
    } else if (corsOrigins && frontendUrl) {
      console.log('   ✅ CORS: Frontend URL is allowed');
    }
  }

  /**
   * Display validation results and exit if errors found
   * @private
   * @returns {boolean}
   */
  _displayResults() {
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length > 0) {
      console.log('❌ ENVIRONMENT VALIDATION FAILED\n');
      console.log('Critical issues found:');
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log('\n💡 Please fix the above issues before starting the server.');
      console.log('   Check your .env file and ensure all required variables are set.\n');
      process.exit(1);
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  ENVIRONMENT VALIDATION PASSED WITH WARNINGS\n');
      console.log('Optional configurations:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('\n💡 These are optional but recommended for full functionality.\n');
    } else {
      console.log('✅ ENVIRONMENT VALIDATION PASSED\n');
      console.log('All environment variables are properly configured.\n');
    }
    
    console.log('🚀 Starting server...\n');
    return true;
  }

  /**
   * Get environment configuration
   * @returns {Object} Environment configuration
   */
  getConfig() {
    return {
      port: process.env.PORT || 3001,
      nodeEnv: process.env.NODE_ENV || 'development',
      mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017',
      dbName: process.env.DB_NAME || 'simonprice_pt_db',
      jwtSecret: process.env.JWT_SECRET,
      jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY,
      jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY,
      frontendUrl: process.env.FRONTEND_URL,
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      email: {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        tenantId: process.env.TENANT_ID,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10
      }
    };
  }
}

module.exports = EnvironmentConfig;