/**
 * Campaign Routes - Landing pages and lead capture
 */

const express = require('express');

function createCampaignRoutes(campaignController, authenticate) {
  const router = express.Router();

  // ==================== PUBLIC ROUTES ====================

  // Get campaign by slug (for landing page)
  router.get('/:slug', (req, res) => campaignController.getCampaignBySlug(req, res));

  // Submit lead (sign up form)
  router.post('/:slug/subscribe', (req, res) => campaignController.submitLead(req, res));

  // ==================== ADMIN ROUTES ====================

  // Get all campaigns
  router.get('/admin/list', authenticate, (req, res) => campaignController.getAllCampaigns(req, res));

  // Get single campaign for editing
  router.get('/admin/:slug', authenticate, (req, res) => campaignController.getAdminCampaign(req, res));

  // Create campaign
  router.post('/admin', authenticate, (req, res) => campaignController.createCampaign(req, res));

  // Update campaign
  router.put('/admin/:slug', authenticate, (req, res) => campaignController.updateCampaign(req, res));

  // Delete campaign
  router.delete('/admin/:slug', authenticate, (req, res) => campaignController.deleteCampaign(req, res));

  // Upload media
  router.post('/admin/upload', authenticate, campaignController.upload.single('media'), (req, res) => campaignController.uploadMedia(req, res));

  // Get campaign leads
  router.get('/admin/:slug/leads', authenticate, (req, res) => campaignController.getCampaignLeads(req, res));

  return router;
}

module.exports = createCampaignRoutes;
