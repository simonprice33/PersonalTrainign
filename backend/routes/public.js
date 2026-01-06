/**
 * Public Routes - No authentication required
 */

const express = require('express');
const { body } = require('express-validator');
const PublicController = require('../controllers/PublicController');

function createPublicRoutes(dependencies) {
  const router = express.Router();
  const { collections, emailConfig, config } = dependencies;

  const controller = new PublicController(collections, emailConfig, config);

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

  return router;
}

module.exports = createPublicRoutes;
