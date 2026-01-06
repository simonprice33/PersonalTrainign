/**
 * Public Controller - Handles public-facing endpoints
 * No authentication required
 */

const { validationResult } = require('express-validator');

class PublicController {
  constructor(collections, emailConfig, config, stripe, authService, emailService) {
    this.collections = collections;
    this.emailConfig = emailConfig;
    this.config = config;
    this.stripe = stripe;
    this.authService = authService;
    this.emailService = emailService;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    res.json({
      success: true,
      status: 'OK',
      service: 'Simon Price PT Backend',
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle contact form submissions
   */
  async handleContact(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { name, email, phone, message, source, goals, experience, optedIn } = req.body;

      // Store in database
      const contactData = {
        name,
        email,
        phone: phone || null,
        message,
        goals: goals || null,
        experience: experience || null,
        source: source || 'website',
        created_at: new Date(),
        status: 'new'
      };

      await this.collections.contacts.insertOne(contactData);

      // If user opted in to mailing list, add them
      if (optedIn === true || optedIn === 'true') {
        const existingSubscriber = await this.collections.mailingList.findOne({ email });
        if (!existingSubscriber) {
          await this.collections.mailingList.insertOne({
            email,
            name,
            opted_in: true,
            subscribed_at: new Date(),
            source: 'contact_form',
            status: 'active'
          });
          console.log(`📧 Contact form submission opted into mailing list: ${email}`);
        }
      }

      // Send notification email if configured
      if (this.emailConfig.getStatus().configured) {
        try {
          const graphClient = await this.emailConfig.createGraphClient();
          const notificationEmail = {
            message: {
              subject: `New Contact Form Submission from ${name}`,
              body: {
                contentType: 'HTML',
                content: `
                  <h2>New Contact Form Submission</h2>
                  <p><strong>Name:</strong> ${name}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                  <p><strong>Goals:</strong> ${goals || 'Not specified'}</p>
                  <p><strong>Experience:</strong> ${experience || 'Not specified'}</p>
                  <p><strong>Message:</strong></p>
                  <p>${message}</p>
                  <p><strong>Opted into mailing list:</strong> ${optedIn ? 'Yes' : 'No'}</p>
                  <p><strong>Source:</strong> ${source || 'website'}</p>
                  <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
                `
              },
              toRecipients: [{
                emailAddress: { address: this.emailConfig.getFromAddress() }
              }]
            }
          };

          await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(notificationEmail);
          console.log(`📧 Contact notification sent for: ${name}`);
        } catch (emailError) {
          console.error('❌ Failed to send notification email:', emailError.message);
        }
      }

      console.log(`📧 New contact form submission: ${name} (${email})`);
      res.status(201).json({
        success: true,
        message: 'Message received. We\'ll get back to you soon!'
      });

    } catch (error) {
      console.error('❌ Contact form error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again.'
      });
    }
  }

  /**
   * Handle client contact submissions (before onboarding)
   */
  async handleClientContact(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { name, email, phone, message, interest } = req.body;

      const contactData = {
        name,
        email,
        phone: phone || null,
        message: message || null,
        interest: interest || null,
        source: 'client_inquiry',
        created_at: new Date(),
        status: 'new'
      };

      await this.collections.contacts.insertOne(contactData);

      console.log(`📧 New client inquiry: ${name} (${email})`);
      res.status(201).json({
        success: true,
        message: 'Thank you for your interest! We\'ll contact you soon.'
      });

    } catch (error) {
      console.error('❌ Client contact error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit inquiry'
      });
    }
  }

  /**
   * Store TDEE calculator results
   */
  async storeTDEEResults(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      // Support both flat and nested structures for backward compatibility
      let email, name, age, gender, weight, height, activityLevel, goal, tdee, goalCalories, macros, joinMailingList;
      
      if (req.body.results && req.body.userInfo) {
        // Nested structure
        email = req.body.email;
        joinMailingList = req.body.joinMailingList;
        tdee = req.body.results.tdee;
        goalCalories = req.body.results.goalCalories;
        macros = req.body.results.macros;
        age = req.body.userInfo.age;
        gender = req.body.userInfo.gender;
        weight = req.body.userInfo.weight;
        height = req.body.userInfo.height;
        activityLevel = req.body.userInfo.activityLevel;
        goal = req.body.userInfo.goal;
        name = req.body.name || null;
      } else {
        // Flat structure
        ({ email, name, age, gender, weight, height, activityLevel, goal, tdee, goalCalories, joinMailingList } = req.body);
      }

      const tdeeData = {
        email,
        name,
        age,
        gender,
        weight,
        height,
        activityLevel,
        goal,
        tdee,
        goalCalories,
        macros: macros || null,
        created_at: new Date()
      };

      await this.collections.tdeeResults.insertOne(tdeeData);

      // If user wants to join mailing list, add them
      if (joinMailingList === true || joinMailingList === 'true') {
        const existingSubscriber = await this.collections.mailingList.findOne({ email });
        if (!existingSubscriber) {
          await this.collections.mailingList.insertOne({
            email,
            name: name || null,
            opted_in: true,
            subscribed_at: new Date(),
            source: 'tdee_calculator',
            age,
            gender,
            goal,
            status: 'active'
          });
          console.log(`📧 TDEE calculator user opted into mailing list: ${email}`);
        }
      }

      // Send TDEE results email to user
      if (this.emailConfig.getStatus().configured) {
        try {
          const graphClient = await this.emailConfig.createGraphClient();
          
          // Format goal for display
          const goalText = goal === 'lose' ? 'Weight Loss' : goal === 'gain' ? 'Muscle Gain' : 'Maintenance';
          
          // Format macros if available
          let macrosHtml = '';
          if (macros) {
            macrosHtml = `
              <h3>Recommended Macros</h3>
              <ul>
                <li><strong>Protein:</strong> ${macros.protein}g (${Math.round((macros.protein * 4 / goalCalories) * 100)}%)</li>
                <li><strong>Carbs:</strong> ${macros.carbs}g (${Math.round((macros.carbs * 4 / goalCalories) * 100)}%)</li>
                <li><strong>Fat:</strong> ${macros.fat}g (${Math.round((macros.fat * 9 / goalCalories) * 100)}%)</li>
              </ul>
            `;
          }

          const resultsEmail = {
            message: {
              subject: 'Your TDEE Calculator Results - Simon Price PT',
              body: {
                contentType: 'HTML',
                content: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Your TDEE Calculator Results</h2>
                    <p>Hi${name ? ' ' + name : ''},</p>
                    <p>Thank you for using the TDEE Calculator! Here are your personalized results:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                      <h3>Your Profile</h3>
                      <ul>
                        <li><strong>Age:</strong> ${age} years</li>
                        <li><strong>Gender:</strong> ${gender}</li>
                        <li><strong>Weight:</strong> ${weight}</li>
                        <li><strong>Height:</strong> ${height}</li>
                        <li><strong>Activity Level:</strong> ${activityLevel}</li>
                        <li><strong>Goal:</strong> ${goalText}</li>
                      </ul>
                    </div>

                    <div style="background-color: #d3ff62; padding: 20px; border-radius: 10px; margin: 20px 0;">
                      <h3>Your Results</h3>
                      <ul>
                        <li><strong>TDEE (Maintenance):</strong> ${Math.round(tdee)} calories/day</li>
                        <li><strong>Goal Calories:</strong> ${Math.round(goalCalories)} calories/day</li>
                      </ul>
                      ${macrosHtml}
                    </div>

                    <div style="background-color: #f0f0f0; padding: 15px; border-left: 4px solid #d3ff62; margin: 20px 0;">
                      <h4>What this means:</h4>
                      ${goal === 'lose' ? 
                        '<p>To lose weight safely, aim for <strong>' + Math.round(goalCalories) + ' calories per day</strong>. This creates a 500-calorie deficit for approximately 1lb weight loss per week.</p>' :
                        goal === 'gain' ?
                        '<p>To build muscle, aim for <strong>' + Math.round(goalCalories) + ' calories per day</strong>. This creates a 300-calorie surplus while focusing on strength training.</p>' :
                        '<p>To maintain your current weight, aim for <strong>' + Math.round(goalCalories) + ' calories per day</strong>.</p>'
                      }
                    </div>

                    <p><strong>Remember:</strong> These are estimates. Monitor your progress and adjust as needed. For personalized coaching and guidance, feel free to reach out!</p>
                    
                    <p style="margin-top: 30px;">
                      Keep pushing!<br>
                      <strong>Simon Price</strong><br>
                      Personal Trainer<br>
                      📧 simon.price@simonprice-pt.co.uk<br>
                      🌐 <a href="https://www.simonprice-pt.co.uk">www.simonprice-pt.co.uk</a>
                    </p>
                  </div>
                `
              },
              toRecipients: [{
                emailAddress: { address: email }
              }]
            }
          };

          await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(resultsEmail);
          console.log(`📧 TDEE results email sent to: ${email}`);
        } catch (emailError) {
          console.error('❌ Failed to send TDEE results email:', emailError.message);
          // Don't fail the request if email fails - results are still saved
        }
      }

      console.log(`📊 TDEE result saved: ${name || email}`);
      res.status(201).json({
        success: true,
        message: 'Results saved successfully! Check your email for the full report.'
      });

    } catch (error) {
      console.error('❌ TDEE results error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save results'
      });
    }
  }

  /**
   * Newsletter subscription
   */
  async subscribeNewsletter(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { email, name } = req.body;

      // Check if already subscribed
      const existing = await this.collections.mailingList.findOne({ email });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email already subscribed'
        });
      }

      const subscriber = {
        email,
        name: name || null,
        subscribed_at: new Date(),
        status: 'active',
        source: 'newsletter_form'
      };

      await this.collections.mailingList.insertOne(subscriber);

      // Send welcome email if configured
      if (this.emailConfig.getStatus().configured) {
        try {
          const graphClient = await this.emailConfig.createGraphClient();
          const welcomeEmail = {
            message: {
              subject: 'Welcome to Simon Price PT Newsletter!',
              body: {
                contentType: 'HTML',
                content: `
                  <h2>Welcome ${name || 'there'}!</h2>
                  <p>Thank you for subscribing to our newsletter. You'll receive updates about:</p>
                  <ul>
                    <li>Fitness tips and workouts</li>
                    <li>Nutrition advice</li>
                    <li>Training programs</li>
                    <li>Special offers</li>
                  </ul>
                  <p>Stay strong!</p>
                  <p>Simon Price<br>Personal Trainer</p>
                `
              },
              toRecipients: [{
                emailAddress: { address: email }
              }]
            }
          };

          await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(welcomeEmail);
          console.log(`📧 Welcome email sent to: ${email}`);
        } catch (emailError) {
          console.error('❌ Failed to send welcome email:', emailError.message);
        }
      }

      console.log(`📧 New newsletter subscriber: ${email}`);
      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to newsletter'
      });

    } catch (error) {
      console.error('❌ Newsletter subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to subscribe'
      });
    }
  }

  /**
   * Unsubscribe from newsletter
   */
  async unsubscribe(req, res) {
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

      const result = await this.collections.mailingList.updateOne(
        { email },
        {
          $set: {
            status: 'unsubscribed',
            unsubscribed_at: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Email not found in mailing list'
        });
      }

      console.log(`📧 Unsubscribed: ${email}`);
      res.json({
        success: true,
        message: 'Successfully unsubscribed from newsletter'
      });

    } catch (error) {
      console.error('❌ Unsubscribe error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe'
      });
    }
  }

  /**
   * Handle purchase from landing page
   * Creates Stripe customer, subscription, client record, and user account
   */
  async handlePurchase(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { packageId, paymentMethodId, clientInfo, parqResponses, healthResponses, hasDoctorApproval } = req.body;

      // Validate required fields
      if (!paymentMethodId) {
        return res.status(400).json({
          success: false,
          message: 'Payment method is required'
        });
      }

      // Get package details
      const pkg = await this.collections.packages.findOne({ id: packageId, active: true });
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      // Check if client already exists
      const existingClient = await this.collections.clients.findOne({ email: clientInfo.email });
      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please log in or use a different email.'
        });
      }

      console.log(`📦 Processing purchase: ${clientInfo.name} - ${pkg.name} (£${pkg.price}/month)`);

      // Step 1: Create Stripe customer
      const customer = await this.stripe.customers.create({
        email: clientInfo.email,
        name: clientInfo.name,
        phone: clientInfo.phone,
        address: {
          line1: clientInfo.addressLine1,
          line2: clientInfo.addressLine2 || '',
          city: clientInfo.city,
          postal_code: clientInfo.postcode,
          country: clientInfo.country || 'GB'
        },
        metadata: {
          package: pkg.name,
          source: 'landing_page_purchase'
        }
      });
      console.log(`👤 Created Stripe customer: ${customer.id}`);

      // Step 2: Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      });

      // Set as default payment method
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      console.log(`💳 Payment method attached to customer`);

      // Step 3: Get or create Stripe product and price
      const monthlyPrice = pkg.price;
      const priceAmount = Math.round(monthlyPrice * 100); // Convert to pence

      // Get or create product
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

      // Step 4: Create subscription with pro-rata billing anchored to 1st of month
      const today = new Date();
      const billingDay = 1; // Always bill on the 1st
      
      // Calculate billing anchor (next occurrence of billing day)
      let billingAnchor = new Date(today);
      billingAnchor.setDate(billingDay);
      if (billingAnchor <= today) {
        billingAnchor.setMonth(billingAnchor.getMonth() + 1);
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: price.id
        }],
        billing_cycle_anchor: Math.floor(billingAnchor.getTime() / 1000),
        proration_behavior: 'create_prorations',
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent']
      });
      console.log(`📋 Created subscription: ${subscription.id} - Status: ${subscription.status}`);

      // Step 5: Create client record in database
      const clientRecord = {
        name: clientInfo.name,
        email: clientInfo.email,
        phone: clientInfo.phone,
        age: parseInt(clientInfo.age),
        address: {
          line1: clientInfo.addressLine1,
          line2: clientInfo.addressLine2 || '',
          city: clientInfo.city,
          postcode: clientInfo.postcode,
          country: clientInfo.country || 'GB'
        },
        goals: clientInfo.goals || [],
        package_id: packageId,
        package_name: pkg.name,
        monthly_price: monthlyPrice,
        billing_day: billingDay,
        customer_id: customer.id,
        stripe_customer_id: customer.id,
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        status: 'active',
        source: 'landing_page',
        parq_responses: parqResponses || [],
        health_responses: healthResponses || [],
        has_doctor_approval: hasDoctorApproval || false,
        created_at: new Date(),
        onboarded_at: new Date(),
        updated_at: new Date()
      };

      await this.collections.clients.insertOne(clientRecord);
      console.log(`✅ Client record created: ${clientInfo.email}`);

      // Step 6: Create client user account
      const existingUser = await this.collections.clientUsers.findOne({ email: clientInfo.email });
      if (!existingUser) {
        await this.collections.clientUsers.insertOne({
          email: clientInfo.email,
          password: null, // Will be set via password setup email
          status: 'pending_password',
          created_at: new Date()
        });
        console.log(`👤 Client user account created: ${clientInfo.email}`);
      }

      // Step 7: Send password setup email
      try {
        const passwordToken = this.authService.generatePasswordSetupToken(clientInfo.email, 'client_password_setup');
        const passwordLink = `${this.config.frontendUrl}/client-create-password/${passwordToken}`;
        
        await this.emailService.sendPasswordSetupEmail(clientInfo.email, passwordLink);
        console.log(`📧 Password setup email sent to: ${clientInfo.email}`);
      } catch (emailError) {
        console.error('⚠️ Failed to send password setup email:', emailError.message);
        // Don't fail the purchase if email fails - client can request password reset later
      }

      console.log(`✅ Purchase completed successfully: ${clientInfo.email} - ${pkg.name}`);

      res.status(201).json({
        success: true,
        message: 'Purchase successful! Check your email to set up your password and access your client portal.',
        subscriptionStatus: subscription.status,
        customerId: customer.id
      });

    } catch (error) {
      console.error('❌ Purchase error:', error);
      
      // Provide user-friendly error messages
      let message = 'Failed to process purchase. Please try again.';
      
      if (error.type === 'StripeCardError') {
        message = error.message || 'Your card was declined. Please try a different card.';
      } else if (error.type === 'StripeInvalidRequestError') {
        message = 'Invalid payment information. Please check your card details.';
      } else if (error.code === 11000) {
        message = 'An account with this email already exists.';
      }
      
      res.status(500).json({
        success: false,
        message
      });
    }
  }
}

module.exports = PublicController;
