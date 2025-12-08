/**
 * Client Routes - Client-facing authentication and portal endpoints
 */

const express = require('express');
const { body } = require('express-validator');
const ClientController = require('../controllers/ClientController');

function createClientRoutes(dependencies) {
  const router = express.Router();
  const { collections, stripe, stripeConfig, emailConfig, authMiddleware, config } = dependencies;

  const controller = new ClientController(collections, stripe, stripeConfig, emailConfig, authMiddleware, config);
  const authenticateClient = (req, res, next) => authMiddleware.authenticateClient(req, res, next);

  // ============================================================================
  // ONBOARDING ENDPOINTS
  // ============================================================================

  // Validate onboarding token
  router.post('/validate-token', [
    body('token').notEmpty().withMessage('Token is required')
  ], (req, res) => controller.validateToken(req, res));

  // Create Stripe SetupIntent
  router.post('/create-setup-intent', (req, res) => controller.createSetupIntent(req, res));

  // Complete onboarding
  router.post('/complete-onboarding', [
    body('token').notEmpty().withMessage('Token is required'),
    body('paymentMethodId').notEmpty().withMessage('Payment method ID required')
  ], (req, res) => controller.completeOnboarding(req, res));

  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================

  // Create password (first-time setup)
  router.post('/create-password', [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ], (req, res) => controller.createPassword(req, res));

  // Client login
  router.post('/login', [
    body('email').isEmail({ allow_utf8_local_part: true }),
    body('password').notEmpty()
  ], (req, res) => controller.login(req, res));

  // Forgot password
  router.post('/forgot-password', [
    body('email').isEmail({ allow_utf8_local_part: true })
  ], (req, res) => controller.forgotPassword(req, res));

  // Reset password
  router.post('/reset-password', [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ], (req, res) => controller.resetPassword(req, res));

  // ============================================================================
  // CLIENT PORTAL (Auth required)
  // ============================================================================

  // Manage billing (Stripe Customer Portal)
  router.post('/manage-billing', authenticateClient, (req, res) => controller.manageBilling(req, res));

  return router;
}

module.exports = createClientRoutes;
