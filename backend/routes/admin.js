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
    body('email').isEmail({ allow_utf8_local_part: true }),
    body('password').notEmpty()
  ], (req, res) => controller.login(req, res));

  // Refresh token
  router.post('/refresh', (req, res) => controller.refreshToken(req, res));

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
    body('email').isEmail({ allow_utf8_local_part: true }),
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

  // Get client details
  router.get('/clients/:email', authenticate, (req, res) => controller.getClientDetails(req, res));

  // Update client status
  router.put('/clients/:email', authenticate, [
    body('status').isIn(['active', 'suspended', 'cancelled', 'pending_payment']).withMessage('Invalid status')
  ], (req, res) => controller.updateClientStatus(req, res));

  // Cancel client subscription
  router.post('/client/:id/cancel-subscription', authenticate, (req, res) => controller.cancelSubscription(req, res));

  // Create Stripe portal session for a client
  router.post('/create-portal-session', authenticate, (req, res) => controller.createPortalSession(req, res));

  // Migrate PARQ questions to set applicable_packages for PT only (POST)
  router.post('/migrate-parq-to-pt-only', authenticate, async (req, res) => {
    try {
      // Force update ALL PARQ questions to only apply to PT with Nutrition
      const result = await dependencies.collections.parqQuestions.updateMany(
        {}, // Match ALL documents
        { $set: { applicable_packages: ['pt-with-nutrition'] } }
      );
      
      // Log for debugging
      const allQuestions = await dependencies.collections.parqQuestions.find({}).toArray();
      console.log('After migration, PARQ questions:', allQuestions.map(q => ({
        question: q.question?.substring(0, 30),
        applicable_packages: q.applicable_packages
      })));
      
      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} PARQ questions to PT with Nutrition only`,
        totalQuestions: allQuestions.length,
        questions: allQuestions.map(q => ({
          id: q.id,
          question: q.question?.substring(0, 50),
          applicable_packages: q.applicable_packages
        }))
      });
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({ success: false, message: 'Migration failed: ' + error.message });
    }
  });

  // GET version - just visit this URL in browser while logged in
  router.get('/migrate-parq-to-pt-only', authenticate, async (req, res) => {
    try {
      const result = await dependencies.collections.parqQuestions.updateMany(
        {},
        { $set: { applicable_packages: ['pt-with-nutrition'] } }
      );
      
      const allQuestions = await dependencies.collections.parqQuestions.find({}).toArray();
      
      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} PARQ questions to PT with Nutrition only`,
        totalQuestions: allQuestions.length,
        questions: allQuestions.map(q => ({
          id: q.id,
          question: q.question?.substring(0, 50),
          applicable_packages: q.applicable_packages
        }))
      });
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({ success: false, message: 'Migration failed: ' + error.message });
    }
  });

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

  // Sync client status from Stripe
  router.post('/clients/:email/sync-status', authenticate, (req, res) => controller.syncClientStatusFromStripe(req, res));

  // ============================================================================
  // DATA NORMALIZATION
  // ============================================================================

  // Normalize all client data to consistent format
  router.post('/normalize-data', authenticate, (req, res) => controller.normalizeClientData(req, res));

  // ============================================================================
  // CANCELLATION POLICY
  // ============================================================================

  // Get all policy sections (admin)
  router.get('/cancellation-policy', authenticate, (req, res) => controller.getCancellationPolicy(req, res));
  
  // Create a new section
  router.post('/cancellation-policy/sections', authenticate, (req, res) => controller.createPolicySection(req, res));
  
  // Reorder sections (MUST be before :sectionId route)
  router.put('/cancellation-policy/sections/reorder', authenticate, (req, res) => controller.reorderPolicySections(req, res));
  
  // Update a section
  router.put('/cancellation-policy/sections/:sectionId', authenticate, (req, res) => controller.updatePolicySection(req, res));
  
  // Delete a section
  router.delete('/cancellation-policy/sections/:sectionId', authenticate, (req, res) => controller.deletePolicySection(req, res));
  
  // Reorder items within section (MUST be before :itemId route)
  router.put('/cancellation-policy/sections/:sectionId/items/reorder', authenticate, (req, res) => controller.reorderPolicyItems(req, res));
  
  // Add item to section
  router.post('/cancellation-policy/sections/:sectionId/items', authenticate, (req, res) => controller.addPolicyItem(req, res));
  
  // Update item in section
  router.put('/cancellation-policy/sections/:sectionId/items/:itemId', authenticate, (req, res) => controller.updatePolicyItem(req, res));
  
  // Delete item from section
  router.delete('/cancellation-policy/sections/:sectionId/items/:itemId', authenticate, (req, res) => controller.deletePolicyItem(req, res));

  // ============================================================================
  // GENERIC POLICY MANAGEMENT (Terms, Privacy, Cookie)
  // ============================================================================

  // Get policy by type
  router.get('/policies/:policyType', authenticate, (req, res) => controller.getPolicy(req, res));
  
  // Create a new section
  router.post('/policies/:policyType/sections', authenticate, (req, res) => controller.createGenericPolicySection(req, res));
  
  // Reorder sections (MUST be before :sectionId route)
  router.put('/policies/:policyType/sections/reorder', authenticate, (req, res) => controller.reorderGenericPolicySections(req, res));
  
  // Update a section
  router.put('/policies/:policyType/sections/:sectionId', authenticate, (req, res) => controller.updateGenericPolicySection(req, res));
  
  // Delete a section
  router.delete('/policies/:policyType/sections/:sectionId', authenticate, (req, res) => controller.deleteGenericPolicySection(req, res));
  
  // Reorder items within section (MUST be before :itemId route)
  router.put('/policies/:policyType/sections/:sectionId/items/reorder', authenticate, (req, res) => controller.reorderGenericPolicyItems(req, res));
  
  // Add item to section
  router.post('/policies/:policyType/sections/:sectionId/items', authenticate, (req, res) => controller.addGenericPolicyItem(req, res));
  
  // Update item in section
  router.put('/policies/:policyType/sections/:sectionId/items/:itemId', authenticate, (req, res) => controller.updateGenericPolicyItem(req, res));
  
  // Delete item from section
  router.delete('/policies/:policyType/sections/:sectionId/items/:itemId', authenticate, (req, res) => controller.deleteGenericPolicyItem(req, res));

  return router;
}

module.exports = createAdminRoutes;
