#!/usr/bin/env node

/**
 * Environment Validation Checker
 * Run this script to validate your .env configuration without starting the server
 * 
 * Usage: node check-env.js
 */

require('dotenv').config();

function checkEnvironment() {
  console.log('🔍 Environment Configuration Checker\n');
  console.log('='.repeat(60));
  
  const errors = [];
  const warnings = [];
  
  // Critical Variables (Server won't start without these)
  const critical = [
    'MONGO_URL',
    'DB_NAME', 
    'JWT_SECRET',
    'JWT_ACCESS_EXPIRY',
    'JWT_REFRESH_EXPIRY',
    'TENANT_ID',
    'CLIENT_ID',
    'CLIENT_SECRET',
    'EMAIL_FROM',
    'FRONTEND_URL',
    'CORS_ORIGINS'
  ];
  
  // Important Variables (Features won't work without these)
  const important = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  // Optional Variables (Nice to have)
  const optional = [
    'EMAIL_TO',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'RECAPTCHA_SECRET_KEY',
    'NODE_ENV',
    'PORT'
  ];
  
  console.log('🔴 CRITICAL VARIABLES (Required for server to start):');
  critical.forEach(key => {
    const value = process.env[key];
    if (!value) {
      errors.push(key);
      console.log(`   ❌ ${key}: Missing`);
    } else {
      console.log(`   ✅ ${key}: Set`);
    }
  });
  
  console.log('\n🟡 IMPORTANT VARIABLES (Required for full functionality):');
  important.forEach(key => {
    const value = process.env[key];
    if (!value) {
      warnings.push(key);
      console.log(`   ⚠️  ${key}: Missing`);
    } else {
      console.log(`   ✅ ${key}: Set`);
    }
  });
  
  console.log('\n🟢 OPTIONAL VARIABLES:');
  optional.forEach(key => {
    const value = process.env[key];
    if (!value) {
      console.log(`   ⚪ ${key}: Not set`);
    } else {
      console.log(`   ✅ ${key}: Set`);
    }
  });
  
  // Specific Validations
  console.log('\n🔍 VALIDATION CHECKS:');
  
  // JWT Secret length
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push('JWT_SECRET too short');
    console.log('   ❌ JWT_SECRET: Too short (minimum 32 characters)');
  } else if (jwtSecret) {
    console.log('   ✅ JWT_SECRET: Length OK');
  }
  
  // Email format
  const emailFrom = process.env.EMAIL_FROM;
  if (emailFrom && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFrom)) {
    errors.push('EMAIL_FROM invalid format');
    console.log('   ❌ EMAIL_FROM: Invalid email format');
  } else if (emailFrom) {
    console.log('   ✅ EMAIL_FROM: Valid format');
  }
  
  // Frontend URL format
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl && !frontendUrl.startsWith('http')) {
    errors.push('FRONTEND_URL invalid format');
    console.log('   ❌ FRONTEND_URL: Must start with http:// or https://');
  } else if (frontendUrl) {
    console.log('   ✅ FRONTEND_URL: Valid format');
  }
  
  // Stripe keys consistency
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripePublic = process.env.STRIPE_PUBLISHABLE_KEY;
  if (stripeSecret && stripePublic) {
    const secretIsTest = stripeSecret.startsWith('sk_test_');
    const publicIsTest = stripePublic.startsWith('pk_test_');
    if (secretIsTest !== publicIsTest) {
      warnings.push('Stripe key mismatch');
      console.log('   ⚠️  STRIPE KEYS: Test/Live mismatch');
    } else {
      console.log(`   ✅ STRIPE KEYS: Consistent (${secretIsTest ? 'Test' : 'Live'} mode)`);
    }
  }
  
  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins && frontendUrl && !corsOrigins.includes(frontendUrl)) {
    warnings.push('CORS configuration issue');
    console.log('   ⚠️  CORS: Frontend URL not in allowed origins');
  } else if (corsOrigins && frontendUrl) {
    console.log('   ✅ CORS: Frontend URL is allowed');
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Summary
  if (errors.length > 0) {
    console.log('❌ CONFIGURATION ERRORS FOUND');
    console.log('\nCritical issues that will prevent server startup:');
    errors.forEach(error => console.log(`   • ${error}`));
    console.log('\n💡 Fix these issues in your .env file before starting the server.');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('⚠️  CONFIGURATION WARNINGS');
    console.log('\nNon-critical issues (server will start but features may not work):');
    warnings.forEach(warning => console.log(`   • ${warning}`));
    console.log('\n💡 Consider addressing these for full functionality.');
    process.exit(0);
  } else {
    console.log('✅ CONFIGURATION IS VALID');
    console.log('\nAll required environment variables are properly set.');
    console.log('Your server should start without issues.');
    process.exit(0);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  checkEnvironment();
}

module.exports = { checkEnvironment };