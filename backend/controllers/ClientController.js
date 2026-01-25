/**
 * Client Controller - Handles client-facing endpoints
 * Authentication and onboarding flows
 */

const { validationResult } = require('express-validator');
const AuthService = require('../services/AuthService');
const EmailService = require('../services/EmailService');
const StripeService = require('../services/StripeService');

class ClientController {
  constructor(collections, stripe, stripeConfig, emailConfig, authMiddleware, config) {
    this.collections = collections;
    this.stripe = stripe;
    this.config = config;

    // Initialize services
    this.authService = new AuthService(authMiddleware, collections);
    this.emailService = new EmailService(emailConfig);
    this.stripeService = new StripeService(stripe, stripeConfig);
  }

  /**
   * Validate client onboarding token
   */
  async validateToken(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Token is required',
          errors: errors.array()
        });
      }

      const { token } = req.body;

      try {
        const decoded = this.authService.verifyToken(token);

        if (decoded.type !== 'client_onboarding') {
          return res.status(400).json({
            success: false,
            message: 'Invalid token type'
          });
        }

        // Fetch client data from database
        const client = await this.collections.clients.findOne({ email: decoded.email }, { _id: 0 });

        if (!client) {
          return res.status(404).json({
            success: false,
            message: 'Client not found'
          });
        }

        // Return client data for form prefilling
        res.status(200).json({
          success: true,
          data: {
            name: client.name,
            email: client.email,
            telephone: client.phone || '',
            price: client.monthly_price || 125, // Get from client record
            billingDay: client.billing_day || 1 // Get from client record, not today's date!
          }
        });

      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

    } catch (error) {
      console.error('❌ Validate token error:', error);
      res.status(500).json({
        success: false,
        message: 'Token validation failed'
      });
    }
  }

  /**
   * Create Stripe SetupIntent for payment method
   * Note: Simplified to match original working code exactly
   */
  async createSetupIntent(req, res) {
    try {
      // Create SetupIntent WITHOUT customer (as in original working code)
      // Customer will be attached during complete-onboarding
      const setupIntent = await this.stripe.setupIntents.create({
        payment_method_types: ['card']
      });

      res.status(200).json({
        success: true,
        clientSecret: setupIntent.client_secret
      });

    } catch (error) {
      console.error('❌ Create setup intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create setup intent'
      });
    }
  }

  /**
   * Complete client onboarding after payment setup
   */
  async completeOnboarding(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { token, paymentMethodId, ...clientData } = req.body;

      // Debug log to see what data we're receiving
      console.log('📝 Complete onboarding received:', {
        hasToken: !!token,
        hasPaymentMethodId: !!paymentMethodId,
        clientData: {
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          dateOfBirth: clientData.dateOfBirth,
          addressLine1: clientData.addressLine1
        }
      });

      // Verify token and extract email
      let decoded;
      try {
        decoded = this.authService.verifyToken(token);
        if (decoded.type !== 'client_onboarding') {
          return res.status(400).json({
            success: false,
            message: 'Invalid token type'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      const email = decoded.email;

      // Find client using exact email
      const client = await this.collections.clients.findOne({ email }, { _id: 0 });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Attach payment method to customer (directly, no setup intent verification needed)
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: client.customer_id
      });

      // Build the full name from form data (client can correct/update their name)
      const fullName = (clientData.firstName && clientData.lastName) 
        ? `${clientData.firstName} ${clientData.lastName}`.trim()
        : (clientData.firstName || clientData.lastName || client.name || '');

      console.log('📝 Updating Stripe customer with name:', fullName);

      // Update Stripe customer with default payment method AND updated name
      await this.stripe.customers.update(client.customer_id, {
        name: fullName,
        invoice_settings: {
          default_payment_method: paymentMethodId
        },
        metadata: {
          first_name: clientData.firstName || '',
          last_name: clientData.lastName || ''
        }
      });

      console.log('✅ Stripe customer updated with name:', fullName);

      // Create subscription with dynamic pricing (like original working code)
      const today = new Date();
      const billingDay = client.billing_day || 1;
      const monthlyPrice = client.monthly_price || 125;
      const priceAmount = Math.round(monthlyPrice * 100); // Convert to pence
      
      // Calculate billing anchor (next occurrence of billing day)
      let billingAnchor = new Date(today);
      billingAnchor.setDate(billingDay);
      if (billingAnchor <= today) {
        billingAnchor.setMonth(billingAnchor.getMonth() + 1);
      }

      // Get or create product (replicating original working logic)
      const products = await this.stripe.products.list({ limit: 1 });
      let product = products.data[0];
      
      if (!product) {
        product = await this.stripe.products.create({
          name: 'Personal Training Subscription',
          description: 'Monthly personal training with Simon Price PT'
        });
        console.log(`✅ Created Stripe product: ${product.id}`);
      }

      // Find or create price for this amount
      const prices = await this.stripe.prices.list({
        product: product.id,
        type: 'recurring',
        limit: 100
      });

      let price = prices.data.find(p => 
        p.unit_amount === priceAmount && 
        p.recurring?.interval === 'month'
      );

      if (!price) {
        price = await this.stripe.prices.create({
          product: product.id,
          currency: 'gbp',
          unit_amount: priceAmount,
          recurring: { interval: 'month' }
        });
        console.log(`✅ Created new price: ${price.id} (£${monthlyPrice}/month)`);
      } else {
        console.log(`✅ Using existing price: ${price.id} (£${monthlyPrice}/month)`);
      }
      
      // Create subscription (like original working code)
      const subscription = await this.stripe.subscriptions.create({
        customer: client.customer_id,
        items: [{
          price: price.id
        }],
        billing_cycle_anchor: Math.floor(billingAnchor.getTime() / 1000),
        proration_behavior: 'create_prorations',
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent']
      });

      // Build update object with client data from form
      const updateData = {
        status: 'active',
        subscription_status: subscription.status,
        subscription_id: subscription.id,
        onboarded_at: new Date(),
        updated_at: new Date()
      };

      // Update name if first/last name provided
      if (clientData.firstName || clientData.lastName) {
        const fullName = [clientData.firstName, clientData.lastName].filter(Boolean).join(' ');
        updateData.name = fullName;
        updateData.first_name = clientData.firstName || '';
        updateData.last_name = clientData.lastName || '';
        console.log('📝 Will update DB with name:', fullName, 'first:', clientData.firstName, 'last:', clientData.lastName);
      }

      // Update address if provided
      if (clientData.addressLine1) {
        updateData.address = {
          line1: clientData.addressLine1,
          line2: clientData.addressLine2 || '',
          city: clientData.city || '',
          postcode: clientData.postcode || '',
          country: clientData.country || 'GB'
        };
      }

      // Update date of birth if provided
      if (clientData.dateOfBirth) {
        updateData.date_of_birth = clientData.dateOfBirth;
      }

      // Update emergency contact if provided
      if (clientData.emergencyContactName) {
        updateData.emergency_contact = {
          name: clientData.emergencyContactName,
          phone: clientData.emergencyContactNumber || '',
          relationship: clientData.emergencyContactRelationship || ''
        };
      }

      // Update client record
      console.log('📝 Updating DB with:', JSON.stringify(updateData, null, 2));
      const dbResult = await this.collections.clients.updateOne(
        { email },
        { $set: updateData }
      );
      console.log('✅ DB update result:', { matchedCount: dbResult.matchedCount, modifiedCount: dbResult.modifiedCount });

      // Create client user if doesn't exist
      const existingUser = await this.collections.clientUsers.findOne({ email });
      if (!existingUser) {
        await this.collections.clientUsers.insertOne({
          email,
          password: null,
          status: 'active',
          created_at: new Date()
        });
      } else {
        await this.collections.clientUsers.updateOne(
          { email },
          { $set: { status: 'active', updated_at: new Date() } }
        );
      }

      // Send password creation email
      const passwordToken = this.authService.generatePasswordSetupToken(email, 'client_password_setup');
      const passwordLink = `${this.config.frontendUrl}/client-create-password/${passwordToken}`;

      await this.emailService.sendPasswordSetupEmail(email, passwordLink);

      console.log(`✅ Client onboarding completed: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Onboarding completed successfully! Check your email to set up your password.',
        subscriptionStatus: subscription.status
      });

    } catch (error) {
      console.error('❌ Complete onboarding error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete onboarding'
      });
    }
  }

  /**
   * Create client password (first-time setup)
   */
  async createPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { token, password } = req.body;

      const email = await this.authService.createClientPassword(token, password);

      console.log(`✅ Client password created: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Password created successfully! You can now login.'
      });

    } catch (error) {
      console.error('❌ Create password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create password'
      });
    }
  }

  /**
   * Client login
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const result = await this.authService.authenticateClient(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      });

    } catch (error) {
      console.error('❌ Client login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  /**
   * Forgot password - Send reset email
   */
  async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      const { email } = req.body;
      const clientUser = await this.collections.clientUsers.findOne({ email }, { _id: 0 });

      if (clientUser && clientUser.password) {
        const resetToken = this.authService.generatePasswordResetToken(email, 'client_password_reset');
        const resetLink = `${this.config.frontendUrl}/client-reset-password/${resetToken}`;

        await this.emailService.sendPasswordResetEmail(email, resetLink, 'client');
        console.log(`📧 Password reset email sent to client: ${email}`);
      } else {
        console.log(`ℹ️ Password reset requested for client without password or non-existent: ${email}`);
      }

      // Always return success for security
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });

    } catch (error) {
      console.error('❌ Forgot password error:', error);
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { token, newPassword, password } = req.body;
      const passwordToUse = newPassword || password;

      // Verify token
      let decoded;
      try {
        decoded = this.authService.verifyToken(token);
        if (decoded.type !== 'client_password_reset') {
          throw new Error('Invalid token type');
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.'
        });
      }

      await this.authService.resetClientPassword(decoded.email, passwordToUse, null);

      console.log(`✅ Client password reset successful for: ${decoded.email}`);

      res.status(200).json({
        success: true,
        message: 'Password reset successful! You can now login with your new password.'
      });

    } catch (error) {
      console.error('❌ Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password. Please try again.'
      });
    }
  }

  /**
   * Get client profile
   */
  async getProfile(req, res) {
    try {
      const userEmail = req.user.email;

      const client = await this.collections.clients.findOne(
        { email: userEmail },
        { projection: { _id: 0 } }
      );

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      res.status(200).json({
        success: true,
        client
      });

    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load profile'
      });
    }
  }

  /**
   * Update client profile
   */
  async updateProfile(req, res) {
    try {
      const userEmail = req.user.email;
      const { name, telephone, address, emergency_contact_name, emergency_contact_number, emergency_contact_relationship } = req.body;

      const client = await this.collections.clients.findOne({ email: userEmail });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Build update object
      const updateData = {
        updated_at: new Date()
      };

      if (name) updateData.name = name;
      if (telephone !== undefined) updateData.telephone = telephone;
      if (address) {
        updateData.address = {
          line1: address.line1 || '',
          line2: address.line2 || '',
          city: address.city || '',
          postcode: address.postcode || '',
          country: address.country || 'GB'
        };
      }
      if (emergency_contact_name !== undefined) updateData.emergency_contact_name = emergency_contact_name;
      if (emergency_contact_number !== undefined) updateData.emergency_contact_number = emergency_contact_number;
      if (emergency_contact_relationship !== undefined) updateData.emergency_contact_relationship = emergency_contact_relationship;

      await this.collections.clients.updateOne(
        { email: userEmail },
        { $set: updateData }
      );

      // Return updated client
      const updatedClient = await this.collections.clients.findOne(
        { email: userEmail },
        { projection: { _id: 0 } }
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        client: updatedClient
      });

    } catch (error) {
      console.error('❌ Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Manage billing - Create Customer Portal session
   */
  async manageBilling(req, res) {
    try {
      const userEmail = req.user.email;

      const client = await this.collections.clients.findOne({ email: userEmail }, { _id: 0 });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Handle both field names
      const stripeCustomerId = client.stripe_customer_id || client.customer_id;
      
      if (!stripeCustomerId) {
        return res.status(400).json({
          success: false,
          message: 'No billing account found. Please contact support.'
        });
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${this.config.frontendUrl}/client/portal`
      });

      res.status(200).json({
        success: true,
        url: session.url
      });

    } catch (error) {
      console.error('❌ Manage billing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to access billing portal. Please try again later.'
      });
    }
  }
}

module.exports = ClientController;
