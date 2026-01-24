/**
 * Public Routes - No authentication required
 */

const express = require('express');
const { body } = require('express-validator');
const PublicController = require('../controllers/PublicController');
const AuthService = require('../services/AuthService');
const EmailService = require('../services/EmailService');

function createPublicRoutes(dependencies) {
  const router = express.Router();
  const { collections, emailConfig, config, stripe, authMiddleware } = dependencies;

  // Initialize services needed for purchase flow
  const authService = new AuthService(authMiddleware, collections);
  const emailService = new EmailService(emailConfig);

  const controller = new PublicController(collections, emailConfig, config, stripe, authService, emailService);

  // Health check
  router.get('/health', (req, res) => controller.healthCheck(req, res));

  // Contact form
  router.post('/contact', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('message').notEmpty().withMessage('Message is required')
  ], (req, res) => controller.handleContact(req, res));

  // Client contact form (pre-onboarding)
  router.post('/client-contact', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required')
  ], (req, res) => controller.handleClientContact(req, res));

  // TDEE calculator results
  router.post('/tdee-results', [
    body('email').isEmail().withMessage('Valid email required')
    // Note: Other fields (tdee, goalCalories, etc.) can be in nested structure
    // Validation is handled in the controller
  ], (req, res) => controller.storeTDEEResults(req, res));

  // Newsletter subscription
  router.post('/newsletter/subscribe', [
    body('email').isEmail().withMessage('Valid email required')
  ], (req, res) => controller.subscribeNewsletter(req, res));

  // Unsubscribe from newsletter
  router.post('/unsubscribe', [
    body('email').isEmail().withMessage('Valid email required')
  ], (req, res) => controller.unsubscribe(req, res));

  // Purchase endpoint (landing page)
  router.post('/public/purchase', [
    body('packageId').notEmpty().withMessage('Package ID required'),
    body('paymentMethodId').notEmpty().withMessage('Payment method ID required'),
    body('clientInfo').isObject().withMessage('Client info required'),
    body('clientInfo.name').notEmpty().withMessage('Name is required'),
    body('clientInfo.email').isEmail().withMessage('Valid email required'),
    body('clientInfo.phone').notEmpty().withMessage('Phone is required'),
    body('parqResponses').isArray().withMessage('PARQ responses required'),
    body('healthResponses').isArray().withMessage('Health responses required')
  ], (req, res) => controller.handlePurchase(req, res));

  // Get cancellation policy (public)
  router.get('/cancellation-policy', async (req, res) => {
    try {
      const sections = await collections.cancellationPolicy
        .find({})
        .sort({ order: 1 })
        .toArray();

      const sortedSections = sections.map(section => ({
        id: section.id,
        title: section.title,
        order: section.order,
        items: (section.items || []).sort((a, b) => a.order - b.order).map(item => ({
          id: item.id,
          text: item.text,
          order: item.order
        }))
      }));

      res.status(200).json({
        success: true,
        sections: sortedSections
      });
    } catch (error) {
      console.error('❌ Get public cancellation policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cancellation policy'
      });
    }
  });

  return router;
}

module.exports = createPublicRoutes;
