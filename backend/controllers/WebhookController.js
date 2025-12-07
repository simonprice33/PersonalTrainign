/**
 * Webhook Controller - Handles Stripe webhook events
 */

class WebhookController {
  constructor(collections, stripe, stripeConfig) {
    this.collections = collections;
    this.stripe = stripe;
    this.stripeConfig = stripeConfig;
    this.webhookSecret = stripeConfig.getWebhookSecret();
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      let event;

      // Verify webhook signature
      try {
        event = this.stripe.webhooks.constructEvent(
          req.body,
          sig,
          this.webhookSecret
        );
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      console.log(`📥 Webhook received: ${event.type}`);

      // Handle the event
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.paused':
          await this.handleSubscriptionPaused(event.data.object);
          break;

        case 'customer.subscription.resumed':
          await this.handleSubscriptionResumed(event.data.object);
          break;

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });

    } catch (error) {
      console.error('❌ Webhook handling error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }

  /**
   * Handle subscription created
   */
  async handleSubscriptionCreated(subscription) {
    try {
      const customerId = subscription.customer;

      await this.collections.clients.updateOne(
        { customer_id: customerId },
        {
          $set: {
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            updated_at: new Date()
          }
        }
      );

      console.log(`✅ Subscription created: ${subscription.id}`);
    } catch (error) {
      console.error('❌ Handle subscription created error:', error);
    }
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription) {
    try {
      const customerId = subscription.customer;

      await this.collections.clients.updateOne(
        { customer_id: customerId },
        {
          $set: {
            subscription_status: subscription.status,
            updated_at: new Date()
          }
        }
      );

      console.log(`✅ Subscription updated: ${subscription.id} -> ${subscription.status}`);
    } catch (error) {
      console.error('❌ Handle subscription updated error:', error);
    }
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(subscription) {
    try {
      const customerId = subscription.customer;

      await this.collections.clients.updateOne(
        { customer_id: customerId },
        {
          $set: {
            status: 'cancelled',
            subscription_status: 'canceled',
            cancelled_at: new Date(),
            updated_at: new Date()
          }
        }
      );

      await this.collections.clientUsers.updateOne(
        { customer_id: customerId },
        {
          $set: {
            status: 'cancelled',
            updated_at: new Date()
          }
        }
      );

      console.log(`❌ Subscription deleted: ${subscription.id}`);
    } catch (error) {
      console.error('❌ Handle subscription deleted error:', error);
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(invoice) {
    try {
      const customerId = invoice.customer;
      const subscriptionId = invoice.subscription;

      // Get client
      const client = await this.collections.clients.findOne({ customer_id: customerId }, { _id: 0 });

      if (!client) {
        console.log(`ℹ️ Client not found for customer: ${customerId}`);
        return;
      }

      // Check if client was suspended due to failed payments
      if (client.status === 'suspended' && client.suspended_reason === 'payment_failure') {
        // Reactivate client
        await this.collections.clients.updateOne(
          { customer_id: customerId },
          {
            $set: {
              status: 'active',
              subscription_status: 'active',
              suspended_at: null,
              suspended_reason: null,
              reactivated_at: new Date(),
              payment_failure_count: 0,
              updated_at: new Date()
            }
          }
        );

        // Resume subscription if it was paused
        if (subscriptionId) {
          try {
            await this.stripe.subscriptions.update(subscriptionId, {
              pause_collection: ''
            });
            console.log(`▶️ Subscription resumed after successful payment: ${subscriptionId}`);
          } catch (error) {
            console.error('❌ Failed to resume subscription:', error.message);
          }
        }

        // Update client user status
        await this.collections.clientUsers.updateOne(
          { email: client.email },
          {
            $set: {
              status: 'active',
              updated_at: new Date()
            }
          }
        );

        console.log(`✅ Client reactivated after payment success: ${client.email}`);
      } else {
        // Just reset payment failure count
        await this.collections.clients.updateOne(
          { customer_id: customerId },
          {
            $set: {
              payment_failure_count: 0,
              updated_at: new Date()
            }
          }
        );
      }

      console.log(`💰 Payment succeeded for customer: ${customerId}`);
    } catch (error) {
      console.error('❌ Handle payment succeeded error:', error);
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    try {
      const customerId = invoice.customer;
      const subscriptionId = invoice.subscription;

      // Get client
      const client = await this.collections.clients.findOne({ customer_id: customerId }, { _id: 0 });

      if (!client) {
        console.log(`ℹ️ Client not found for customer: ${customerId}`);
        return;
      }

      // Increment failure count
      const failureCount = (client.payment_failure_count || 0) + 1;

      await this.collections.clients.updateOne(
        { customer_id: customerId },
        {
          $set: {
            payment_failure_count: failureCount,
            last_payment_failure: new Date(),
            updated_at: new Date()
          }
        }
      );

      // If 3 or more failures, suspend account
      if (failureCount >= 3) {
        await this.collections.clients.updateOne(
          { customer_id: customerId },
          {
            $set: {
              status: 'suspended',
              suspended_at: new Date(),
              suspended_reason: 'payment_failure',
              updated_at: new Date()
            }
          }
        );

        // Pause subscription
        if (subscriptionId) {
          try {
            await this.stripe.subscriptions.update(subscriptionId, {
              pause_collection: { behavior: 'mark_uncollectible' }
            });
            console.log(`⏸️ Subscription paused due to payment failures: ${subscriptionId}`);
          } catch (error) {
            console.error('❌ Failed to pause subscription:', error.message);
          }
        }

        // Update client user status
        await this.collections.clientUsers.updateOne(
          { email: client.email },
          {
            $set: {
              status: 'suspended',
              updated_at: new Date()
            }
          }
        );

        console.log(`⚠️ Client suspended after ${failureCount} payment failures: ${client.email}`);
      } else {
        console.log(`⚠️ Payment failed (${failureCount}/3) for customer: ${customerId}`);
      }

    } catch (error) {
      console.error('❌ Handle payment failed error:', error);
    }
  }

  /**
   * Handle subscription paused
   */
  async handleSubscriptionPaused(subscription) {
    try {
      const customerId = subscription.customer;

      await this.collections.clients.updateOne(
        { customer_id: customerId },
        {
          $set: {
            subscription_status: 'paused',
            updated_at: new Date()
          }
        }
      );

      console.log(`⏸️ Subscription paused: ${subscription.id}`);
    } catch (error) {
      console.error('❌ Handle subscription paused error:', error);
    }
  }

  /**
   * Handle subscription resumed
   */
  async handleSubscriptionResumed(subscription) {
    try {
      const customerId = subscription.customer;

      await this.collections.clients.updateOne(
        { customer_id: customerId },
        {
          $set: {
            subscription_status: 'active',
            updated_at: new Date()
          }
        }
      );

      console.log(`▶️ Subscription resumed: ${subscription.id}`);
    } catch (error) {
      console.error('❌ Handle subscription resumed error:', error);
    }
  }
}

module.exports = WebhookController;
