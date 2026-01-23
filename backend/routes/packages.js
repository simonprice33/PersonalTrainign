const express = require('express');
const { body } = require('express-validator');
const PackageController = require('../controllers/PackageController');

function createPackageRoutes(dependencies) {
  const router = express.Router();
  const { collections, stripe, config, authMiddleware } = dependencies;
  const authenticate = authMiddleware.authenticate.bind(authMiddleware);
  
  const controller = new PackageController(collections, stripe, config);

  // Debug endpoint - check PARQ filtering (no auth required for debugging)
  router.get('/debug/parq-check', async (req, res) => {
    try {
      const { packageId } = req.query;
      
      // Get all PARQ questions
      const allQuestions = await collections.parqQuestions.find({}).toArray();
      
      // Get filtered questions using the same logic
      let query = { active: true };
      if (packageId) {
        query.$or = [
          { applicable_packages: { $exists: false } },
          { applicable_packages: { $size: 0 } },
          { applicable_packages: packageId },
          { applicable_packages: 'all' }
        ];
      }
      const filteredQuestions = await collections.parqQuestions.find(query).toArray();
      
      res.json({
        packageId: packageId || 'none provided',
        totalQuestions: allQuestions.length,
        filteredCount: filteredQuestions.length,
        allQuestions: allQuestions.map(q => ({
          id: q.id,
          question: q.question?.substring(0, 40),
          applicable_packages: q.applicable_packages,
          active: q.active
        })),
        filteredQuestions: filteredQuestions.map(q => ({
          id: q.id,
          question: q.question?.substring(0, 40)
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public migration endpoint (no auth for easier access during debugging)
  router.get('/debug/migrate-parq', async (req, res) => {
    try {
      const result = await collections.parqQuestions.updateMany(
        {},
        { $set: { applicable_packages: ['pt-with-nutrition'] } }
      );
      
      const allQuestions = await collections.parqQuestions.find({}).toArray();
      
      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} PARQ questions`,
        questions: allQuestions.map(q => ({
          id: q.id,
          question: q.question?.substring(0, 40),
          applicable_packages: q.applicable_packages
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public routes
  router.get('/public/packages', (req, res) => controller.getPackages(req, res));
  router.get('/public/parq-questions', (req, res) => controller.getParqQuestions(req, res));
  router.get('/public/health-questions', (req, res) => controller.getHealthQuestions(req, res));

  // Admin routes - Packages
  router.get('/admin/packages', authenticate, (req, res) => controller.getAllPackages(req, res));
  router.post('/admin/packages', authenticate, [
    body('name').notEmpty().withMessage('Name required'),
    body('price').isNumeric().withMessage('Price must be numeric'),
    body('description').notEmpty().withMessage('Description required')
  ], (req, res) => controller.createPackage(req, res));
  router.put('/admin/packages/:id', authenticate, (req, res) => controller.updatePackage(req, res));
  router.delete('/admin/packages/:id', authenticate, (req, res) => controller.deletePackage(req, res));
  
  // Clear "Most Popular" flag from all packages
  router.post('/admin/packages/clear-popular', authenticate, async (req, res) => {
    try {
      await collections.packages.updateMany({}, { $set: { is_popular: false } });
      res.json({ success: true, message: 'Cleared popular flag from all packages' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin routes - PARQ Questions
  router.get('/admin/parq-questions', authenticate, (req, res) => controller.getAllParqQuestions(req, res));
  router.post('/admin/parq-questions', authenticate, [
    body('question').notEmpty().withMessage('Question required')
  ], (req, res) => controller.createParqQuestion(req, res));
  router.put('/admin/parq-questions/:id', authenticate, (req, res) => controller.updateParqQuestion(req, res));
  router.delete('/admin/parq-questions/:id', authenticate, (req, res) => controller.deleteParqQuestion(req, res));

  // Admin routes - Health Questions
  router.get('/admin/health-questions', authenticate, (req, res) => controller.getAllHealthQuestions(req, res));
  router.post('/admin/health-questions', authenticate, [
    body('question').notEmpty().withMessage('Question required'),
    body('type').isIn(['text', 'multiple_choice', 'yes_no']).withMessage('Invalid type')
  ], (req, res) => controller.createHealthQuestion(req, res));
  router.put('/admin/health-questions/:id', authenticate, (req, res) => controller.updateHealthQuestion(req, res));
  router.delete('/admin/health-questions/:id', authenticate, (req, res) => controller.deleteHealthQuestion(req, res));

  return router;
}

module.exports = createPackageRoutes;