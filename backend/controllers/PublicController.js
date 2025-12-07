/**
 * Public Controller - Handles public-facing endpoints
 * No authentication required
 */

const { validationResult } = require('express-validator');

class PublicController {
  constructor(collections, emailConfig, config) {
    this.collections = collections;
    this.emailConfig = emailConfig;
    this.config = config;
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

      console.log(`📊 TDEE result saved: ${name || email}`);
      res.status(201).json({
        success: true,
        message: 'Results saved successfully'
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
}

module.exports = PublicController;
