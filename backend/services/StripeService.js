/**
 * Stripe Service - Handles all Stripe operations
 * Implements Single Responsibility Principle
 */

class StripeService {
  constructor(stripe, stripeConfig) {
    this.stripe = stripe;
    this.stripeConfig = stripeConfig;
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured() {
    return !!this.stripe;
  }

  /**
   * Create or retrieve a Stripe product
   */
  async getOrCreateProduct(name, description = null) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      // First, try to find existing product
      const products = await this.stripe.products.list({ 
        limit: 100,
        active: true 
      });
      
      const existingProduct = products.data.find(product => 
        product.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingProduct) {
        console.log(`📦 Using existing Stripe product: ${existingProduct.id}`);
        return existingProduct;
      }

      // Create new product if not found
      const product = await this.stripe.products.create({
        name,
        description: description || `${name} subscription`,
        type: 'service'
      });

      console.log(`📦 Created new Stripe product: ${product.id}`);
      return product;
    } catch (error) {
      console.error('❌ Stripe product creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Create or retrieve a price for a product
   */
  async getOrCreatePrice(productId, amount, currency = 'gbp', interval = 'month') {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      // First, try to find existing price
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true
      });

      const existingPrice = prices.data.find(price => 
        price.unit_amount === Math.round(amount * 100) &&
        price.currency === currency &&
        price.recurring?.interval === interval
      );

      if (existingPrice) {
        console.log(`💰 Using existing Stripe price: ${existingPrice.id}`);
        return existingPrice;
      }

      // Create new price if not found
      const price = await this.stripe.prices.create({
        product: productId,
        unit_amount: Math.round(amount * 100),
        currency,
        recurring: { interval }
      });

      console.log(`💰 Created new Stripe price: ${price.id}`);
      return price;
    } catch (error) {
      console.error('❌ Stripe price creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(customerData) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.telephone,
        address: customerData.address ? {
          line1: customerData.address.line1,
          line2: customerData.address.line2,
          city: customerData.address.city,
          postal_code: customerData.address.postcode,
          country: customerData.address.country || 'GB'
        } : undefined,
        metadata: {
          created_via: 'admin_panel',
          client_id: customerData.client_id
        }
      });

      console.log(`👤 Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      console.error('❌ Stripe customer creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(customerId, priceId, options = {}) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const subscriptionData = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        ...options
      };

      // Add proration if specified
      if (options.prorate) {
        subscriptionData.proration_behavior = 'create_prorations';
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);
      console.log(`📋 Created Stripe subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      console.error('❌ Stripe subscription creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(subscriptionId, status) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      let updateData = {};

      switch (status) {
        case 'cancelled':
          await this.stripe.subscriptions.cancel(subscriptionId);
          console.log(`🛑 Cancelled Stripe subscription: ${subscriptionId}`);
          return;

        case 'suspended':
          updateData = {
            pause_collection: { behavior: 'void' }
          };
          console.log(`⏸️ Pausing Stripe subscription: ${subscriptionId}`);
          break;

        case 'active':
          updateData = {
            pause_collection: null
          };
          console.log(`▶️ Resuming Stripe subscription: ${subscriptionId}`);
          break;

        default:
          throw new Error(`Invalid subscription status: ${status}`);
      }

      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateData);
      console.log(`✅ Updated Stripe subscription status: ${subscriptionId} -> ${status}`);
      return subscription;
    } catch (error) {
      console.error('❌ Stripe subscription update failed:', error.message);
      throw error;
    }
  }

  /**
   * Create customer portal session
   */
  async createCustomerPortalSession(customerId, returnUrl) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });

      console.log(`🔗 Created billing portal session for customer: ${customerId}`);
      return portalSession;
    } catch (error) {
      console.error('❌ Stripe portal session creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Retrieve customer by ID
   */
  async getCustomer(customerId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      console.error('❌ Failed to retrieve Stripe customer:', error.message);
      throw error;
    }
  }

  /**
   * Get customer subscriptions
   */
  async getCustomerSubscriptions(customerId, limit = 10) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        limit
      });
      return subscriptions;
    } catch (error) {
      console.error('❌ Failed to retrieve customer subscriptions:', error.message);
      throw error;
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhook(payload, signature) {
    return this.stripeConfig.validateWebhook(payload, signature);
  }
}

module.exports = StripeService;