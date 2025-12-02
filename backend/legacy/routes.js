/**
 * Legacy Routes - Temporary file containing all existing routes
 * TODO: Break these down into proper controller/service modules
 */

const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

module.exports = function(app) {
  // Extract dependencies from app.locals
  const getAppDependencies = (req) => ({
    db: req.app.locals.db,
    collections: req.app.locals.collections,
    stripe: req.app.locals.stripe,
    stripeConfig: req.app.locals.stripeConfig,
    emailConfig: req.app.locals.emailConfig,
    authMiddleware: req.app.locals.authMiddleware,
    config: req.app.locals.config
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  });

  // ========================================================================
  // EMAIL SUBSCRIPTION ENDPOINTS (Legacy - to be moved to EmailController)
  // ========================================================================
  
  app.post('/api/subscribe', [
    body('email').isEmail().withMessage('Valid email required'),
    body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { collections, emailConfig } = getAppDependencies(req);
      const { email, name } = req.body;

      // Check if email already exists
      const existingSubscriber = await collections.mailingList.findOne({ email });
      if (existingSubscriber) {
        return res.status(409).json({
          success: false,
          message: 'Email already subscribed'
        });
      }

      // Add to mailing list
      const subscriber = {
        email,
        name,
        subscribed_at: new Date(),
        status: 'active',
        source: 'website'
      };

      await collections.mailingList.insertOne(subscriber);

      // Send welcome email if configured
      if (emailConfig.getStatus().configured) {
        try {
          const graphClient = await emailConfig.createGraphClient();
          const welcomeEmail = {
            message: {
              subject: 'Welcome to Simon Price PT Newsletter!',
              body: {
                contentType: 'HTML',
                content: `
                  <h2>Welcome ${name}!</h2>
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

          await graphClient.api(`/users/${emailConfig.getFromAddress()}/sendMail`).post(welcomeEmail);
          console.log(`📧 Welcome email sent to: ${email}`);
        } catch (emailError) {
          console.error('❌ Failed to send welcome email:', emailError.message);
        }
      }

      console.log(`📧 New subscriber: ${name} (${email})`);
      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to newsletter'
      });

    } catch (error) {
      console.error('❌ Subscribe error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to subscribe'
      });
    }
  });

  // ========================================================================
  // PLACEHOLDER FOR OTHER ENDPOINTS
  // TODO: Move all other endpoints from original server.js here
  // ========================================================================

  console.log('📋 Legacy routes loaded (temporary)');
  console.log('⚠️  TODO: Refactor into proper controllers/services');
};

// Export for potential direct use
module.exports.getAppDependencies = (req) => ({
  db: req.app.locals.db,
  collections: req.app.locals.collections,
  stripe: req.app.locals.stripe,
  stripeConfig: req.app.locals.stripeConfig,
  emailConfig: req.app.locals.emailConfig,
  authMiddleware: req.app.locals.authMiddleware,
  config: req.app.locals.config
});