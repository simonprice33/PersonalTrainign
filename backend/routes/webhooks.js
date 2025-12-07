/**
 * Webhook Routes - Stripe webhook handling
 */

const express = require('express');
const WebhookController = require('../controllers/WebhookController');

function createWebhookRoutes(dependencies) {
  const router = express.Router();
  const { collections, stripe, stripeConfig } = dependencies;

  const controller = new WebhookController(collections, stripe, stripeConfig);

  // Stripe webhook endpoint
  // Note: This endpoint receives raw body, handled in server-new.js
  router.post('/stripe', (req, res) => controller.handleStripeWebhook(req, res));

  return router;
}

module.exports = createWebhookRoutes;
