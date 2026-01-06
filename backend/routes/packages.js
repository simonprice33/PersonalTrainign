const express = require('express');
const { body } = require('express-validator');

function createPackageRoutes(controller, authenticate) {
  const router = express.Router();

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