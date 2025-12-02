/**
 * Stripe Configuration and Initialization
 * Implements Single Responsibility Principle - handles only Stripe setup
 */

class StripeConfig {
  constructor(config) {
    this.secretKey = config.stripe.secretKey;
    this.publishableKey = config.stripe.publishableKey;
    this.webhookSecret = config.stripe.webhookSecret;
    this.stripe = null;
  }

  /**
   * Initialize Stripe if API key is provided
   * @returns {Object|null} Stripe instance or null
   */
  initialize() {
    if (!this.secretKey) {
      console.log('⚠️  Stripe not configured - payment features disabled');
      return null;
    }

    try {
      const Stripe = require('stripe');
      this.stripe = Stripe(this.secretKey);
      
      const isTest = this.secretKey.startsWith('sk_test_');
      console.log(`✅ Stripe initialized (${isTest ? 'Test' : 'Live'} mode)`);
      console.log(`🔑 Publishable key: ${this.publishableKey ? 'Configured' : 'Missing'}`);
      console.log(`🔗 Webhook secret: ${this.webhookSecret ? 'Configured' : 'Missing'}`);
      
      return this.stripe;
    } catch (error) {
      console.error('❌ Stripe initialization failed:', error.message);
      return null;
    }
  }

  /**
   * Get Stripe instance
   * @returns {Object|null} Stripe instance
   */
  getStripe() {
    return this.stripe;
  }

  /**
   * Get webhook secret
   * @returns {string|null} Webhook secret
   */
  getWebhookSecret() {
    return this.webhookSecret;
  }

  /**
   * Validate webhook signature
   * @param {string} payload Raw webhook payload
   * @param {string} signature Stripe signature header
   * @returns {Object|null} Validated event or null
   */
  validateWebhook(payload, signature) {
    if (!this.stripe || !this.webhookSecret) {
      throw new Error('Stripe or webhook secret not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
    } catch (error) {
      console.error('❌ Webhook validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get configuration summary
   * @returns {Object} Configuration status
   */
  getStatus() {
    return {
      configured: !!this.stripe,
      mode: this.secretKey ? (this.secretKey.startsWith('sk_test_') ? 'test' : 'live') : null,
      webhookConfigured: !!this.webhookSecret,
      publishableKeyConfigured: !!this.publishableKey
    };
  }
}

module.exports = StripeConfig;