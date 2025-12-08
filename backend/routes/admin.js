/**
 * Admin Routes - Authentication required
 */

const express = require('express');
const { body } = require('express-validator');
const AdminController = require('../controllers/AdminController');

function createAdminRoutes(dependencies) {
  const router = express.Router();
  const { collections, stripe, stripeConfig, emailConfig, authMiddleware, config } = dependencies;

  const controller = new AdminController(collections, stripe, stripeConfig, emailConfig, authMiddleware, config);
  const authenticate = (req, res, next) => authMiddleware.authenticate(req, res, next);

  // ============================================================================
  // AUTHENTICATION ENDPOINTS (No auth required)
  // ============================================================================

  // Admin setup (one-time)
  router.post('/setup', (req, res) => controller.setup(req, res));

  // Admin login
  router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ], (req, res) => controller.login(req, res));

  // Refresh token
  router.post('/refresh', (req, res) => controller.refreshToken(req, res));

  // Forgot password
  router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
  ], (req, res) => controller.forgotPassword(req, res));

  // Reset password
  router.post('/reset-password', [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ], (req, res) => controller.resetPassword(req, res));

  // ============================================================================
  // ADMIN USER MANAGEMENT (Auth required)
  // ============================================================================

  // Change password (authenticated)
  router.post('/change-password', authenticate, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ], (req, res) => controller.changePassword(req, res));

  // Get all admin users
  router.get('/users', authenticate, (req, res) => controller.getUsers(req, res));

  // Create new admin user
  router.post('/users', authenticate, [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty()
  ], (req, res) => controller.createUser(req, res));

  // Delete admin user
  router.delete('/users/:id', authenticate, (req, res) => controller.deleteUser(req, res));

  // ============================================================================
  // MAILING LIST MANAGEMENT
  // ============================================================================

  // Get all emails
  router.get('/emails', authenticate, (req, res) => controller.getEmails(req, res));

  // Export emails as CSV
  router.get('/emails/export', authenticate, (req, res) => controller.exportEmails(req, res));

  // ============================================================================
  // CLIENT MANAGEMENT
  // ============================================================================

  // Create payment link for new client
  router.post('/create-payment-link', authenticate, [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail({ allow_utf8_local_part: true }).withMessage('Valid email required')
  ], (req, res) => controller.createPaymentLink(req, res));

  // Resend payment link
  router.post('/resend-payment-link', authenticate, [
    body('email').isEmail({ allow_utf8_local_part: true }).withMessage('Valid email required')
  ], (req, res) => controller.resendPaymentLink(req, res));

  // Get all clients
  router.get('/clients', authenticate, (req, res) => controller.getClients(req, res));

  // Update client status
  router.put('/clients/:email', authenticate, [
    body('status').isIn(['active', 'suspended', 'cancelled', 'pending_payment']).withMessage('Invalid status')
  ], (req, res) => controller.updateClientStatus(req, res));

  // Cancel client subscription
  router.post('/client/:id/cancel-subscription', authenticate, (req, res) => controller.cancelSubscription(req, res));

  // ============================================================================
  // CLIENT USER MANAGEMENT
  // ============================================================================

  // Get all client users
  router.get('/client-users', authenticate, (req, res) => controller.getClientUsers(req, res));

  // Update client user status
  router.put('/client-users/:email/status', authenticate, [
    body('status').isIn(['active', 'suspended', 'pending']).withMessage('Invalid status')
  ], (req, res) => controller.updateClientUserStatus(req, res));

  // Resend password setup email
  router.post('/client-users/:email/resend-password-email', authenticate, (req, res) => controller.resendPasswordEmail(req, res));

  // ============================================================================
  // STRIPE CUSTOMER IMPORT
  // ============================================================================

  // Fetch customers from Stripe
  router.post('/import-customers/fetch', authenticate, [
    body('customerIds').isArray().withMessage('Customer IDs must be an array')
  ], (req, res) => controller.fetchStripeCustomers(req, res));

  // Save imported customers
  router.post('/import-customers/save', authenticate, [
    body('customers').isArray().withMessage('Customers must be an array')
  ], (req, res) => controller.saveImportedCustomers(req, res));

  return router;
}

module.exports = createAdminRoutes;
