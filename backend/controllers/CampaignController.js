/**
 * Campaign Controller - Handles campaign landing pages and lead capture
 */

const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class CampaignController {
  constructor(collections) {
    this.collections = collections;
    
    // Setup multer for campaign media uploads
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/campaigns');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `campaign-${uniqueSuffix}${ext}`);
      }
    });

    this.upload = multer({
      storage,
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
        if (extname && mimetype) {
          return cb(null, true);
        }
        cb(new Error('Only image and video files are allowed'));
      }
    });
  }

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Get campaign by slug (public)
   */
  async getCampaignBySlug(req, res) {
    try {
      const { slug } = req.params;

      const campaign = await this.collections.campaigns.findOne(
        { slug, status: 'active' },
        { projection: { _id: 0 } }
      );

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      res.status(200).json({
        success: true,
        campaign
      });
    } catch (error) {
      console.error('❌ Get campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign'
      });
    }
  }

  /**
   * Submit lead for a campaign (public)
   */
  async submitLead(req, res) {
    try {
      const { slug } = req.params;
      const { name, email } = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name is required'
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      // Check if campaign exists and is active
      const campaign = await this.collections.campaigns.findOne({ slug, status: 'active' });
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found or inactive'
        });
      }

      // Check if email already exists for this campaign
      const existingLead = await this.collections.emailSubscribers.findOne({
        email: email.toLowerCase(),
        source: `campaign_${slug}`
      });

      if (existingLead) {
        return res.status(409).json({
          success: false,
          message: 'You have already signed up for this campaign'
        });
      }

      // Save to email_subscribers collection
      const lead = {
        email: email.toLowerCase(),
        name: name.trim(),
        source: `campaign_${slug}`,
        campaign_slug: slug,
        campaign_title: campaign.title,
        status: 'opted_in',
        subscribed_at: new Date(),
        created_at: new Date()
      };

      await this.collections.emailSubscribers.insertOne(lead);

      // Increment campaign lead count
      await this.collections.campaigns.updateOne(
        { slug },
        { $inc: { lead_count: 1 } }
      );

      console.log(`✅ New lead captured for campaign "${slug}": ${email}`);

      res.status(201).json({
        success: true,
        message: 'Thank you for signing up!',
        afterSubmit: campaign.afterSubmit || { type: 'message', message: 'Thank you for signing up!' }
      });
    } catch (error) {
      console.error('❌ Submit lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit. Please try again.'
      });
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all campaigns (admin)
   */
  async getAllCampaigns(req, res) {
    try {
      const campaigns = await this.collections.campaigns
        .find({}, { projection: { _id: 0 } })
        .sort({ created_at: -1 })
        .toArray();

      res.status(200).json({
        success: true,
        campaigns
      });
    } catch (error) {
      console.error('❌ Get all campaigns error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch campaigns'
      });
    }
  }

  /**
   * Get single campaign for editing (admin)
   */
  async getAdminCampaign(req, res) {
    try {
      const { slug } = req.params;

      const campaign = await this.collections.campaigns.findOne(
        { slug },
        { projection: { _id: 0 } }
      );

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      res.status(200).json({
        success: true,
        campaign
      });
    } catch (error) {
      console.error('❌ Get admin campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign'
      });
    }
  }

  /**
   * Create new campaign (admin)
   */
  async createCampaign(req, res) {
    try {
      const {
        title,
        slug,
        header,
        description,
        media,
        submitButtonText,
        afterSubmit,
        status
      } = req.body;

      // Validate required fields
      if (!title || !slug) {
        return res.status(400).json({
          success: false,
          message: 'Title and slug are required'
        });
      }

      // Check if slug already exists
      const existingCampaign = await this.collections.campaigns.findOne({ slug });
      if (existingCampaign) {
        return res.status(409).json({
          success: false,
          message: 'A campaign with this URL slug already exists'
        });
      }

      const campaign = {
        title,
        slug: this.generateSlug(slug),
        header: header || '',
        description: description || '',
        media: media || [],
        submitButtonText: submitButtonText || 'Sign Up',
        afterSubmit: afterSubmit || { type: 'message', message: 'Thank you for signing up!' },
        status: status || 'inactive',
        lead_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.collections.campaigns.insertOne(campaign);

      console.log(`✅ Campaign created: ${title} (/${slug})`);

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        campaign: { ...campaign, _id: undefined }
      });
    } catch (error) {
      console.error('❌ Create campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign'
      });
    }
  }

  /**
   * Update campaign (admin)
   */
  async updateCampaign(req, res) {
    try {
      const { slug } = req.params;
      const {
        title,
        new_slug,
        header,
        description,
        media,
        submitButtonText,
        afterSubmit,
        status
      } = req.body;

      // Check if campaign exists
      const existingCampaign = await this.collections.campaigns.findOne({ slug });
      if (!existingCampaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Check if new slug conflicts
      if (new_slug && new_slug !== slug) {
        const slugConflict = await this.collections.campaigns.findOne({ slug: new_slug });
        if (slugConflict) {
          return res.status(409).json({
            success: false,
            message: 'A campaign with this URL slug already exists'
          });
        }
      }

      const updateData = {
        title: title || existingCampaign.title,
        slug: new_slug ? this.generateSlug(new_slug) : slug,
        header: header !== undefined ? header : existingCampaign.header,
        description: description !== undefined ? description : existingCampaign.description,
        media: media !== undefined ? media : existingCampaign.media,
        submitButtonText: submitButtonText || existingCampaign.submitButtonText,
        afterSubmit: afterSubmit || existingCampaign.afterSubmit,
        status: status || existingCampaign.status,
        updated_at: new Date()
      };

      await this.collections.campaigns.updateOne(
        { slug },
        { $set: updateData }
      );

      console.log(`✅ Campaign updated: ${title || existingCampaign.title}`);

      res.status(200).json({
        success: true,
        message: 'Campaign updated successfully',
        campaign: updateData
      });
    } catch (error) {
      console.error('❌ Update campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update campaign'
      });
    }
  }

  /**
   * Delete campaign (admin)
   */
  async deleteCampaign(req, res) {
    try {
      const { slug } = req.params;

      const result = await this.collections.campaigns.deleteOne({ slug });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      console.log(`✅ Campaign deleted: ${slug}`);

      res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete campaign'
      });
    }
  }

  /**
   * Upload media for campaign (admin)
   */
  async uploadMedia(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      const isVideo = req.file.mimetype.startsWith('video/');
      const mediaUrl = `/api/uploads/campaigns/${req.file.filename}`;

      console.log(`✅ Campaign media uploaded: ${req.file.filename} (${isVideo ? 'video' : 'image'})`);

      res.status(200).json({
        success: true,
        media: {
          id: uuidv4(),
          type: isVideo ? 'video' : 'image',
          url: mediaUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('❌ Upload media error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload media'
      });
    }
  }

  /**
   * Get leads for a campaign (admin)
   */
  async getCampaignLeads(req, res) {
    try {
      const { slug } = req.params;

      const leads = await this.collections.emailSubscribers
        .find(
          { campaign_slug: slug },
          { projection: { _id: 0 } }
        )
        .sort({ subscribed_at: -1 })
        .toArray();

      res.status(200).json({
        success: true,
        leads,
        count: leads.length
      });
    } catch (error) {
      console.error('❌ Get campaign leads error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leads'
      });
    }
  }

  // ==================== HELPERS ====================

  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

module.exports = CampaignController;
