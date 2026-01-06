/**
 * Admin Controller - Handles all admin-related endpoints
 * Uses services for business logic
 */

const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const ClientService = require('../services/ClientService');
const EmailService = require('../services/EmailService');
const StripeService = require('../services/StripeService');
const AuthService = require('../services/AuthService');

class AdminController {
  constructor(collections, stripe, stripeConfig, emailConfig, authMiddleware, config) {
    this.collections = collections;
    this.stripe = stripe;
    this.config = config;
    
    // Initialize services
    this.clientService = new ClientService(collections, stripe, stripeConfig);
    this.emailService = new EmailService(emailConfig);
    this.stripeService = new StripeService(stripe, stripeConfig);
    this.authService = new AuthService(authMiddleware, collections);
  }

  /**
   * Admin setup - Create default admin (one-time use)
   */
  async setup(req, res) {
    try {
      const existingAdmin = await this.collections.users.findOne({});
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin user already exists. Use login instead.'
        });
      }

      const defaultEmail = 'simon.price@simonprice-pt.co.uk';
      const defaultPassword = 'Qwerty1234!!!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const adminUser = {
        email: defaultEmail,
        password: hashedPassword,
        name: 'Simon Price',
        role: 'admin',
        created_at: new Date(),
        last_login: null
      };

      await this.collections.users.insertOne(adminUser);
      console.log(`✅ Default admin user created: ${defaultEmail}`);

      res.status(201).json({
        success: true,
        message: 'Default admin user created successfully',
        email: defaultEmail
      });

    } catch (error) {
      console.error('❌ Admin setup error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating admin user'
      });
    }
  }

  /**
   * Admin login
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
      const result = await this.authService.authenticateAdmin(email, password);

      // Update last login
      await this.collections.users.updateOne(
        { email },
        { $set: { last_login: new Date() } }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      });

    } catch (error) {
      console.error('❌ Admin login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      const newAccessToken = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        accessToken: newAccessToken
      });

    } catch (error) {
      console.error('❌ Token refresh error:', error);
      res.status(403).json({
        success: false,
        message: 'Invalid or expired refresh token'
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
      const admin = await this.collections.users.findOne({ email }, { _id: 0 });

      if (admin) {
        const resetToken = this.authService.generatePasswordResetToken(email, 'admin_password_reset');
        const resetLink = `${this.config.frontendUrl}/admin/reset-password?token=${resetToken}`;

        await this.emailService.sendPasswordResetEmail(email, resetLink, 'admin');
        console.log(`📧 Password reset email sent to admin: ${email}`);
      } else {
        console.log(`ℹ️ Password reset requested for non-existent admin email: ${email}`);
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

      const { token, newPassword } = req.body;

      // Verify token
      let decoded;
      try {
        decoded = this.authService.verifyToken(token);
        if (decoded.type !== 'admin_password_reset') {
          throw new Error('Invalid token type');
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.'
        });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.collections.users.updateOne(
        { email: decoded.email },
        {
          $set: {
            password: hashedPassword,
            updated_at: new Date(),
            password_reset_at: new Date()
          }
        }
      );

      console.log(`✅ Admin password reset successful for: ${decoded.email}`);

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
   * Change password (authenticated)
   */
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      await this.authService.changeAdminPassword(req.user.email, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password'
      });
    }
  }

  /**
   * Get all admin users
   */
  async getUsers(req, res) {
    try {
      const users = await this.collections.users.find({}, { _id: 0, password: 0 }).toArray();

      res.status(200).json({
        success: true,
        users
      });

    } catch (error) {
      console.error('❌ Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  /**
   * Create new admin user
   */
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { email, password, name, role } = req.body;

      // Check if user already exists
      const existingUser = await this.collections.users.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        email,
        password: hashedPassword,
        name,
        role: role || 'admin',
        created_at: new Date(),
        created_by: req.user.email,
        last_login: null
      };

      const result = await this.collections.users.insertOne(newUser);
      console.log(`✅ New admin user created: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: { 
          _id: result.insertedId,
          email, 
          name, 
          role: role || 'admin' 
        }
      });

    } catch (error) {
      console.error('❌ Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  }

  /**
   * Delete admin user
   */
  async deleteUser(req, res) {
    try {
      const { id: email } = req.params;

      // Prevent self-deletion
      if (email === req.user.email) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const result = await this.collections.users.deleteOne({ email });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log(`✅ Admin user deleted: ${email}`);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('❌ Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }

  /**
   * Get all emails from mailing list
   */
  async getEmails(req, res) {
    try {
      const emails = await this.collections.mailingList.find({}, { _id: 0 }).toArray();

      res.status(200).json({
        success: true,
        emails
      });

    } catch (error) {
      console.error('❌ Get emails error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emails'
      });
    }
  }

  /**
   * Export emails as CSV
   */
  async exportEmails(req, res) {
    try {
      const emails = await this.collections.mailingList.find({ status: 'active' }, { _id: 0 }).toArray();

      // Create CSV
      let csv = 'Email,Name,Subscribed At,Source\n';
      emails.forEach(subscriber => {
        csv += `${subscriber.email},${subscriber.name || ''},${subscriber.subscribed_at || ''},${subscriber.source || ''}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=mailing-list.csv');
      res.status(200).send(csv);

    } catch (error) {
      console.error('❌ Export emails error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export emails'
      });
    }
  }

  /**
   * Create Stripe payment link for client
   */
  async createPaymentLink(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { name, email, phone, telephone, address, billingDay, price } = req.body;
      
      // Frontend sends 'telephone', backend uses 'phone'
      const phoneNumber = phone || telephone || null;
      
      // Default billing day to 1st if not provided
      const clientBillingDay = billingDay || 1;
      const monthlyPrice = price || 125;

      // Check if client already exists (use exact email as entered)
      const existingClient = await this.collections.clients.findOne({ email });
      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: 'A client with this email already exists'
        });
      }

      // Create Stripe customer (use exact email as entered)
      const customer = await this.stripe.customers.create({
        name,
        email,
        phone: phoneNumber || undefined,
        address: address || undefined,
        metadata: {
          source: 'admin_created'
        }
      });

      // Create payment link token (use exact email)
      const paymentToken = this.authService.generatePasswordSetupToken(email, 'client_onboarding');
      const paymentLink = `${this.config.frontendUrl}/client-onboarding?token=${paymentToken}`;

      // Store client in database (use exact email as entered)
      const clientData = {
        customer_id: customer.id,
        name,
        email,
        phone: phoneNumber,
        address: address || null,
        status: 'pending_payment',
        subscription_status: 'pending',
        billing_day: clientBillingDay,
        monthly_price: monthlyPrice,
        payment_link_sent_at: new Date(),
        created_at: new Date(),
        created_by: req.user.email
      };

      await this.collections.clients.insertOne(clientData);

      // Send payment link email
      await this.emailService.sendPaymentLinkEmail(email, name, paymentLink);

      console.log(`✅ Payment link created and sent to: ${email}`);

      res.status(201).json({
        success: true,
        message: 'Payment link created and sent successfully',
        paymentLink
      });

    } catch (error) {
      console.error('❌ Create payment link error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create payment link'
      });
    }
  }

  /**
   * Resend payment link to client
   */
  async resendPaymentLink(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Find client (use exact email)
      const client = await this.collections.clients.findOne({ email }, { _id: 0 });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Check if already active
      if (client.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Client is already active with an active subscription'
        });
      }

      // Generate new payment link (use exact email)
      const paymentToken = this.authService.generatePasswordSetupToken(email, 'client_onboarding');
      const paymentLink = `${this.config.frontendUrl}/client-onboarding?token=${paymentToken}`;

      // Send email
      await this.emailService.sendPaymentLinkEmail(email, client.name, paymentLink);

      // Update last sent timestamp
      await this.collections.clients.updateOne(
        { email },
        { $set: { payment_link_sent_at: new Date() } }
      );

      console.log(`✅ Payment link resent to: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Payment link resent successfully'
      });

    } catch (error) {
      console.error('❌ Resend payment link error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend payment link'
      });
    }
  }

  /**
   * Get all clients
   */
  async getClients(req, res) {
    try {
      const clients = await this.collections.clients.find({}, { _id: 0 }).toArray();

      res.status(200).json({
        success: true,
        count: clients.length,
        clients
      });

    } catch (error) {
      console.error('❌ Get clients error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch clients'
      });
    }
  }

  /**
   * Update client status
   */
  async updateClientStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { email } = req.params;
      const { status, reason } = req.body;

      const client = await this.collections.clients.findOne({ email }, { _id: 0 });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Handle Stripe subscription updates based on status
      if (client.customer_id && client.subscription_status === 'active') {
        const subscriptions = await this.stripe.subscriptions.list({
          customer: client.customer_id,
          status: 'active'
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];

          if (status === 'suspended') {
            // Pause subscription
            await this.stripe.subscriptions.update(subscription.id, {
              pause_collection: { behavior: 'mark_uncollectible' }
            });
            console.log(`⏸️ Subscription paused for client: ${email}`);
          } else if (status === 'cancelled') {
            // Cancel subscription
            await this.stripe.subscriptions.cancel(subscription.id);
            console.log(`❌ Subscription cancelled for client: ${email}`);
          } else if (status === 'active' && client.status === 'suspended') {
            // Resume subscription
            await this.stripe.subscriptions.update(subscription.id, {
              pause_collection: ''
            });
            console.log(`▶️ Subscription resumed for client: ${email}`);
          }
        }
      }

      // Update client status in database
      const updateData = {
        status,
        updated_at: new Date()
      };

      if (status === 'suspended') {
        updateData.suspended_at = new Date();
        updateData.suspended_reason = reason || 'Admin action';
      } else if (status === 'active' && client.status === 'suspended') {
        updateData.reactivated_at = new Date();
        updateData.suspended_at = null;
        updateData.suspended_reason = null;
      }

      await this.collections.clients.updateOne({ email }, { $set: updateData });

      console.log(`✅ Client status updated: ${email} -> ${status}`);

      res.status(200).json({
        success: true,
        message: 'Client status updated successfully'
      });

    } catch (error) {
      console.error('❌ Update client status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update client status'
      });
    }
  }

  /**
   * Get all client users
   */
  async getClientUsers(req, res) {
    try {
      const clientUsers = await this.collections.clientUsers.find({}, { _id: 0, password: 0 }).toArray();

      res.status(200).json({
        success: true,
        count: clientUsers.length,
        clientUsers
      });

    } catch (error) {
      console.error('❌ Get client users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client users'
      });
    }
  }

  /**
   * Update client user status
   */
  async updateClientUserStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { email } = req.params;
      const { status } = req.body;

      const result = await this.collections.clientUsers.updateOne(
        { email },
        {
          $set: {
            status,
            updated_at: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client user not found'
        });
      }

      console.log(`✅ Client user status updated: ${email} -> ${status}`);

      res.status(200).json({
        success: true,
        message: 'Client user status updated successfully'
      });

    } catch (error) {
      console.error('❌ Update client user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update client user status'
      });
    }
  }

  /**
   * Resend password setup email to client
   */
  async resendPasswordEmail(req, res) {
    try {
      const { email } = req.params;

      const clientUser = await this.collections.clientUsers.findOne({ email }, { _id: 0 });
      if (!clientUser) {
        return res.status(404).json({
          success: false,
          message: 'Client user not found'
        });
      }

      // Check if password already set
      if (clientUser.password) {
        return res.status(400).json({
          success: false,
          message: 'Client has already set up their password'
        });
      }

      // Generate new password setup token
      const passwordToken = this.authService.generatePasswordSetupToken(email, 'client_password_setup');
      const passwordLink = `${this.config.frontendUrl}/client-create-password/${passwordToken}`;

      // Send password setup email
      await this.emailService.sendPasswordSetupEmail(email, passwordLink);

      // Update last email sent timestamp
      await this.collections.clientUsers.updateOne(
        { email },
        { $set: { last_password_email_sent: new Date() } }
      );

      console.log(`✅ Password setup email resent to: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Password setup email sent successfully'
      });

    } catch (error) {
      console.error('❌ Resend password email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend password email'
      });
    }
  }

  /**
   * Fetch customers from Stripe for import
   */
  async fetchStripeCustomers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { customerIds } = req.body;

      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of customer IDs'
        });
      }

      const fetchedCustomers = [];
      const errors_list = [];

      for (const customerId of customerIds) {
        try {
          const customer = await this.stripe.customers.retrieve(customerId);
          
          // Get payment methods
          const paymentMethods = await this.stripe.paymentMethods.list({
            customer: customerId,
            type: 'card'
          });

          // Get subscriptions
          const subscriptions = await this.stripe.subscriptions.list({
            customer: customerId
          });

          const hasPaymentMethod = paymentMethods.data.length > 0;
          const activeSubscription = subscriptions.data.find(sub => sub.status === 'active');
          const cancelledSubscription = subscriptions.data.find(sub => sub.status === 'canceled');

          // Determine status
          let status = 'pending';
          if (cancelledSubscription) {
            status = 'cancelled';
          } else if (hasPaymentMethod && activeSubscription) {
            status = 'active';
          }

          fetchedCustomers.push({
            customer_id: customer.id,
            name: customer.name || 'Unknown',
            email: customer.email,
            phone: customer.phone || null,
            address: customer.address || null,
            status,
            subscription_status: activeSubscription ? activeSubscription.status : null,
            hasPaymentMethod
          });

        } catch (error) {
          errors_list.push({
            customerId,
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        customers: fetchedCustomers,
        errors: errors_list
      });

    } catch (error) {
      console.error('❌ Fetch Stripe customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers from Stripe'
      });
    }
  }

  /**
   * Save imported customers to database
   */
  async saveImportedCustomers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { customers } = req.body;

      if (!Array.isArray(customers) || customers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of customers to import'
        });
      }

      const imported = [];
      const skipped = [];
      const failedEmails = [];

      for (const customerData of customers) {
        try {
          const { email, name, customer_id, phone, address, status, subscription_status, hasPaymentMethod } = customerData;

          // Check if client already exists
          const existingClient = await this.collections.clients.findOne({ email });
          if (existingClient) {
            skipped.push(email);
            continue;
          }

          // Insert client (use consistent field naming)
          const clientDoc = {
            customer_id,           // Keep for backward compatibility
            stripe_customer_id: customer_id,  // Also add this for frontend compatibility
            name,
            email,
            phone: phone || null,
            address: address || null,
            status,
            subscription_status,
            imported_at: new Date(),
            imported_by: req.user.email,
            created_at: new Date()
          };

          await this.collections.clients.insertOne(clientDoc);

          // Create client user entry
          const clientUserDoc = {
            email,
            password: null,
            status: status === 'active' ? 'active' : 'pending',
            created_at: new Date()
          };

          await this.collections.clientUsers.insertOne(clientUserDoc);

          // Send password creation email
          const passwordToken = this.authService.generatePasswordSetupToken(email, 'client_password_setup');
          const passwordLink = `${this.config.frontendUrl}/client-create-password/${passwordToken}`;

          try {
            await this.emailService.sendPasswordSetupEmail(email, passwordLink);

            // If no payment method, also send payment setup request
            if (!hasPaymentMethod) {
              await this.emailService.sendPaymentMethodRequestEmail(email, name);
            }
          } catch (emailError) {
            console.error(`❌ Failed to send emails to ${email}:`, emailError.message);
            failedEmails.push(email);
          }

          imported.push(email);
          console.log(`✅ Imported customer: ${email}`);

        } catch (error) {
          console.error(`❌ Failed to import customer ${customerData.email}:`, error);
          skipped.push(customerData.email);
        }
      }

      res.status(200).json({
        success: true,
        message: `Import complete. ${imported.length} imported, ${skipped.length} skipped`,
        imported,
        skipped,
        failedEmails
      });

    } catch (error) {
      console.error('❌ Save imported customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save imported customers'
      });
    }
  }

  /**
   * Get client details
   */
  async getClientDetails(req, res) {
    try {
      const { email } = req.params;

      const client = await this.collections.clients.findOne({ email }, { _id: 0 });
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      res.json({
        success: true,
        client
      });

    } catch (error) {
      console.error('❌ Get client details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client details'
      });
    }
  }

  /**
   * Sync client status from Stripe
   */
  async syncClientStatusFromStripe(req, res) {
    try {
      const { email } = req.params;

      // Find client
      const client = await this.collections.clients.findOne({ email }, { _id: 0 });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      const customerId = client.customer_id || client.stripe_customer_id;
      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'Client has no Stripe customer ID'
        });
      }

      // Fetch from Stripe
      const customer = await this.stripe.customers.retrieve(customerId, {
        expand: ['subscriptions']
      });

      // Determine status based on Stripe data
      let status = 'pending';
      let subscription_status = 'none';

      if (customer.subscriptions && customer.subscriptions.data.length > 0) {
        const activeSubscription = customer.subscriptions.data.find(
          sub => ['active', 'trialing'].includes(sub.status)
        );
        
        if (activeSubscription) {
          status = 'active';
          subscription_status = activeSubscription.status;
        } else {
          subscription_status = customer.subscriptions.data[0].status;
        }
      }

      // Update client in database
      await this.collections.clients.updateOne(
        { email },
        {
          $set: {
            status,
            subscription_status,
            synced_at: new Date()
          }
        }
      );

      console.log(`✅ Synced client status from Stripe: ${email} - ${status}`);

      res.json({
        success: true,
        message: 'Client status synced successfully',
        data: {
          status,
          subscription_status
        }
      });

    } catch (error) {
      console.error('❌ Sync client status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync client status'
      });
    }
  }

  /**
   * Cancel client subscription
   */
  async cancelSubscription(req, res) {
    try {
      const { id: email } = req.params;

      const client = await this.collections.clients.findOne({ email }, { _id: 0 });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      if (!client.customer_id) {
        return res.status(400).json({
          success: false,
          message: 'No Stripe customer associated with this client'
        });
      }

      // Cancel all active subscriptions
      const subscriptions = await this.stripe.subscriptions.list({
        customer: client.customer_id,
        status: 'active'
      });

      for (const subscription of subscriptions.data) {
        await this.stripe.subscriptions.cancel(subscription.id);
      }

      // Update client status
      await this.collections.clients.updateOne(
        { email },
        {
          $set: {
            status: 'cancelled',
            subscription_status: 'canceled',
            cancelled_at: new Date(),
            updated_at: new Date()
          }
        }
      );

      console.log(`❌ Subscription cancelled for: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully'
      });

    } catch (error) {
      console.error('❌ Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel subscription'
      });
    }
  }

  /**
   * Create Stripe Customer Portal session for a specific customer
   */
  async createPortalSession(req, res) {
    try {
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${this.config.frontendUrl}/admin/clients`
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
  }
}

module.exports = AdminController;
