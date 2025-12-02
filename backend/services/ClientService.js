/**
 * Client Service - Handles client business logic
 * Implements Single Responsibility Principle
 */

class ClientService {
  constructor(collections, stripeService, emailService, authService) {
    this.collections = collections;
    this.stripeService = stripeService;
    this.emailService = emailService;
    this.authService = authService;
  }

  /**
   * Create a new client with payment link
   */
  async createClientWithPayment(clientData, priceData, options = {}) {
    try {
      // Create Stripe customer if Stripe is configured
      let stripeCustomer = null;
      let subscription = null;
      
      if (this.stripeService.isConfigured()) {
        // Create/get product and price
        const product = await this.stripeService.getOrCreateProduct(
          priceData.name || 'Personal Training',
          'Personal training subscription'
        );
        
        const price = await this.stripeService.getOrCreatePrice(
          product.id,
          priceData.amount,
          priceData.currency || 'gbp'
        );

        // Create Stripe customer
        stripeCustomer = await this.stripeService.createCustomer(clientData);

        // Create subscription
        subscription = await this.stripeService.createSubscription(
          stripeCustomer.id,
          price.id,
          {
            prorate: options.prorate || false,
            collection_method: 'charge_automatically'
          }
        );
      }

      // Save client to database
      const client = {
        ...clientData,
        stripe_customer_id: stripeCustomer?.id,
        stripe_subscription_id: subscription?.id,
        subscription_status: subscription?.status || 'pending',
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: options.createdBy
      };

      await this.collections.clients.insertOne(client);

      // Create client user account for portal access
      await this.collections.clientUsers.insertOne({
        email: clientData.email,
        password: null, // Will be set when they create it
        status: 'pending',
        created_at: new Date()
      });

      console.log(`✅ Client created: ${clientData.name} (${clientData.email})`);

      return {
        client,
        stripeCustomer,
        subscription,
        paymentLink: subscription?.latest_invoice?.hosted_invoice_url
      };
    } catch (error) {
      console.error('❌ Client creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Import client from Stripe
   */
  async importClientFromStripe(stripeCustomerId, adminEmail, frontendUrl) {
    try {
      if (!this.stripeService.isConfigured()) {
        throw new Error('Stripe not configured');
      }

      // Get customer from Stripe
      const customer = await this.stripeService.getCustomer(stripeCustomerId);
      
      if (customer.deleted) {
        throw new Error('Customer has been deleted in Stripe');
      }

      // Check if already exists
      const existingClient = await this.collections.clients.findOne({ 
        stripe_customer_id: stripeCustomerId 
      });
      
      if (existingClient) {
        throw new Error('Customer already exists in database');
      }

      // Get subscriptions
      const subscriptions = await this.stripeService.getCustomerSubscriptions(stripeCustomerId, 1);
      const subscription = subscriptions.data[0];
      
      // Determine status
      let status = 'pending';
      let hasPaymentMethod = false;

      if (subscription) {
        hasPaymentMethod = !!subscription.default_payment_method;
        
        if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
          status = 'cancelled';
        } else if (subscription.status === 'active' && hasPaymentMethod) {
          status = 'active';
        }
      }

      // Create client record
      const clientData = {
        stripe_customer_id: stripeCustomerId,
        name: customer.name || '',
        email: customer.email || '',
        telephone: customer.phone || '',
        address: customer.address ? {
          line1: customer.address.line1 || '',
          line2: customer.address.line2 || '',
          city: customer.address.city || '',
          postcode: customer.address.postal_code || '',
          country: customer.address.country || ''
        } : {},
        status,
        stripe_subscription_id: subscription?.id || null,
        subscription_status: subscription?.status || null,
        current_period_end: subscription?.current_period_end ? 
          new Date(subscription.current_period_end * 1000) : null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminEmail,
        imported: true
      };

      await this.collections.clients.insertOne(clientData);

      // Create client user account
      await this.collections.clientUsers.insertOne({
        email: customer.email,
        password: null,
        status,
        created_at: new Date()
      });

      // Send emails
      const passwordToken = this.authService.generatePasswordSetupToken(customer.email);
      
      await this.emailService.sendPasswordCreationEmail(
        customer.name || customer.email,
        customer.email,
        passwordToken,
        frontendUrl
      );

      // Send card details email if no payment method
      if (status === 'pending' && !hasPaymentMethod) {
        await this.emailService.sendCardDetailsRequestEmail(
          customer.name || customer.email,
          customer.email
        );
      }

      console.log(`✅ Imported client from Stripe: ${customer.name || customer.email}`);
      
      return {
        client: clientData,
        hasPaymentMethod,
        emailsSent: status === 'pending' && !hasPaymentMethod ? 2 : 1
      };
    } catch (error) {
      console.error('❌ Client import failed:', error.message);
      throw error;
    }
  }

  /**
   * Update client status
   */
  async updateClientStatus(email, newStatus, updatedBy) {
    try {
      // Get client data
      const client = await this.collections.clients.findOne({ email });
      if (!client) {
        throw new Error('Client not found');
      }

      const currentStatus = client.status;

      // Update Stripe subscription if status change requires it
      if (this.stripeService.isConfigured() && client.stripe_subscription_id && currentStatus !== newStatus) {
        await this.stripeService.updateSubscriptionStatus(client.stripe_subscription_id, newStatus);
      }

      // Update status in both collections
      await this.collections.clients.updateOne(
        { email },
        { 
          $set: { 
            status: newStatus,
            subscription_status: newStatus,
            updated_at: new Date(),
            updated_by: updatedBy
          }
        }
      );

      await this.collections.clientUsers.updateOne(
        { email },
        { 
          $set: { 
            status: newStatus,
            updated_at: new Date()
          }
        }
      );

      console.log(`✅ Client status updated: ${email} -> ${newStatus}`);
      
      return {
        email,
        oldStatus: currentStatus,
        newStatus,
        stripeUpdated: !!(this.stripeService.isConfigured() && client.stripe_subscription_id)
      };
    } catch (error) {
      console.error('❌ Client status update failed:', error.message);
      throw error;
    }
  }

  /**
   * Get client data
   */
  async getClient(email) {
    try {
      const client = await this.collections.clients.findOne({ email }, { _id: 0 });
      return client;
    } catch (error) {
      console.error('❌ Failed to get client:', error.message);
      throw error;
    }
  }

  /**
   * Get all clients
   */
  async getAllClients() {
    try {
      const clients = await this.collections.clients.find({}, { _id: 0 }).toArray();
      return clients;
    } catch (error) {
      console.error('❌ Failed to get clients:', error.message);
      throw error;
    }
  }

  /**
   * Get client users with status information
   */
  async getClientUsers() {
    try {
      const clientUsers = await this.collections.clientUsers.find({}, { _id: 0 }).toArray();
      
      // Merge with client data for additional information
      const enrichedUsers = await Promise.all(
        clientUsers.map(async (user) => {
          const client = await this.collections.clients.findOne(
            { email: user.email },
            { _id: 0, name: 1, telephone: 1 }
          );
          
          return {
            ...user,
            name: client?.name || '',
            telephone: client?.telephone || '',
            hasPassword: !!user.password
          };
        })
      );

      return enrichedUsers;
    } catch (error) {
      console.error('❌ Failed to get client users:', error.message);
      throw error;
    }
  }

  /**
   * Resend password setup email
   */
  async resendPasswordEmail(email, frontendUrl) {
    try {
      const clientUser = await this.collections.clientUsers.findOne({ email });
      const client = await this.collections.clients.findOne({ email });

      if (!clientUser) {
        throw new Error('Client user not found');
      }

      if (clientUser.password && clientUser.status === 'active') {
        throw new Error('Client has already created their password');
      }

      const passwordToken = this.authService.generatePasswordSetupToken(email);
      
      await this.emailService.sendPasswordReminderEmail(
        client?.name || email,
        email,
        passwordToken,
        frontendUrl
      );

      // Update last email sent timestamp
      await this.collections.clientUsers.updateOne(
        { email },
        { 
          $set: { 
            last_password_email_sent: new Date(),
            updated_at: new Date()
          }
        }
      );

      console.log(`📧 Password setup email resent to: ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Resend password email failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(stripeCustomerId, attemptCount) {
    try {
      const client = await this.collections.clients.findOne({ 
        stripe_customer_id: stripeCustomerId 
      });
      
      if (!client) {
        console.log(`❌ No client found for Stripe customer: ${stripeCustomerId}`);
        return;
      }

      // Update failed payment count
      await this.collections.clients.updateOne(
        { stripe_customer_id: stripeCustomerId },
        { 
          $set: { 
            last_payment_failed: new Date(),
            payment_failure_count: attemptCount,
            updated_at: new Date()
          }
        }
      );

      // After 3 failed attempts, suspend the client
      if (attemptCount >= 3) {
        await this.updateClientStatus(client.email, 'suspended', 'system');
        
        // Update suspension details
        await this.collections.clients.updateOne(
          { email: client.email },
          { 
            $set: { 
              suspended_reason: 'payment_failure',
              suspended_at: new Date()
            }
          }
        );

        console.log(`🛑 Client suspended due to payment failures: ${client.email}`);
      }

      return client;
    } catch (error) {
      console.error('❌ Payment failure handling failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(stripeCustomerId) {
    try {
      const client = await this.collections.clients.findOne({ 
        stripe_customer_id: stripeCustomerId 
      });
      
      if (!client) {
        console.log(`❌ No client found for Stripe customer: ${stripeCustomerId}`);
        return;
      }

      const updateData = {
        last_payment_succeeded: new Date(),
        payment_failure_count: 0,
        updated_at: new Date()
      };

      // Reactivate if suspended due to payment failure
      if (client.status === 'suspended' && client.suspended_reason === 'payment_failure') {
        await this.updateClientStatus(client.email, 'active', 'system');
        
        updateData.suspended_reason = null;
        updateData.suspended_at = null;
        updateData.reactivated_at = new Date();

        console.log(`🔄 Client reactivated after successful payment: ${client.email}`);
      }

      await this.collections.clients.updateOne(
        { stripe_customer_id: stripeCustomerId },
        { $set: updateData }
      );

      return client;
    } catch (error) {
      console.error('❌ Payment success handling failed:', error.message);
      throw error;
    }
  }
}

module.exports = ClientService;