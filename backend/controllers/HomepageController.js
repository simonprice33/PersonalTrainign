/**
 * Homepage Controller - Handles homepage content management
 */

const { v4: uuidv4 } = require('uuid');

class HomepageController {
  constructor(collections) {
    this.collections = collections;
  }

  /**
   * Get all homepage content (public)
   */
  async getHomepageContent(req, res) {
    try {
      const content = await this.collections.homepageContent.findOne(
        { type: 'main' },
        { projection: { _id: 0 } }
      );

      if (!content) {
        // Return default empty structure
        return res.status(200).json({
          success: true,
          content: this._getDefaultContent()
        });
      }

      res.status(200).json({
        success: true,
        content
      });
    } catch (error) {
      console.error('❌ Get homepage content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch homepage content'
      });
    }
  }

  /**
   * Update homepage content (admin)
   */
  async updateHomepageContent(req, res) {
    try {
      const { section, data } = req.body;

      if (!section || !data) {
        return res.status(400).json({
          success: false,
          message: 'Section and data are required'
        });
      }

      const validSections = ['hero', 'services', 'about', 'contact', 'general'];
      if (!validSections.includes(section)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid section'
        });
      }

      // Update specific section
      const updateKey = `${section}`;
      await this.collections.homepageContent.updateOne(
        { type: 'main' },
        { 
          $set: { 
            [updateKey]: data,
            updated_at: new Date()
          }
        },
        { upsert: true }
      );

      console.log(`✅ Homepage ${section} section updated`);

      res.status(200).json({
        success: true,
        message: `${section} section updated successfully`
      });
    } catch (error) {
      console.error('❌ Update homepage content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update homepage content'
      });
    }
  }

  /**
   * Import default content from mockdata structure
   */
  async importDefaultContent(req, res) {
    try {
      const defaultContent = this._getDefaultContent();
      
      await this.collections.homepageContent.updateOne(
        { type: 'main' },
        { 
          $set: {
            ...defaultContent,
            type: 'main',
            imported_at: new Date(),
            updated_at: new Date()
          }
        },
        { upsert: true }
      );

      console.log('✅ Homepage default content imported');

      res.status(200).json({
        success: true,
        message: 'Default content imported successfully',
        content: defaultContent
      });
    } catch (error) {
      console.error('❌ Import default content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import default content'
      });
    }
  }

  /**
   * Add a service
   */
  async addService(req, res) {
    try {
      const { icon, title, description, features } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }

      const newService = {
        id: uuidv4(),
        icon: icon || 'Star',
        title,
        description,
        features: features || [],
        order: Date.now()
      };

      await this.collections.homepageContent.updateOne(
        { type: 'main' },
        { 
          $push: { 'services.items': newService },
          $set: { updated_at: new Date() }
        },
        { upsert: true }
      );

      res.status(201).json({
        success: true,
        message: 'Service added successfully',
        service: newService
      });
    } catch (error) {
      console.error('❌ Add service error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add service'
      });
    }
  }

  /**
   * Update a service
   */
  async updateService(req, res) {
    try {
      const { id } = req.params;
      const { icon, title, description, features, order } = req.body;

      const updateFields = {};
      if (icon !== undefined) updateFields['services.items.$.icon'] = icon;
      if (title !== undefined) updateFields['services.items.$.title'] = title;
      if (description !== undefined) updateFields['services.items.$.description'] = description;
      if (features !== undefined) updateFields['services.items.$.features'] = features;
      if (order !== undefined) updateFields['services.items.$.order'] = order;

      await this.collections.homepageContent.updateOne(
        { type: 'main', 'services.items.id': id },
        { $set: { ...updateFields, updated_at: new Date() } }
      );

      res.status(200).json({
        success: true,
        message: 'Service updated successfully'
      });
    } catch (error) {
      console.error('❌ Update service error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update service'
      });
    }
  }

  /**
   * Delete a service
   */
  async deleteService(req, res) {
    try {
      const { id } = req.params;

      await this.collections.homepageContent.updateOne(
        { type: 'main' },
        { 
          $pull: { 'services.items': { id } },
          $set: { updated_at: new Date() }
        }
      );

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete service error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete service'
      });
    }
  }

  /**
   * Reorder services
   */
  async reorderServices(req, res) {
    try {
      const { serviceIds } = req.body;

      if (!Array.isArray(serviceIds)) {
        return res.status(400).json({
          success: false,
          message: 'serviceIds must be an array'
        });
      }

      // Get current content
      const content = await this.collections.homepageContent.findOne({ type: 'main' });
      if (!content || !content.services?.items) {
        return res.status(404).json({
          success: false,
          message: 'No services found'
        });
      }

      // Reorder services based on serviceIds array
      const reorderedItems = serviceIds.map((id, index) => {
        const item = content.services.items.find(s => s.id === id);
        if (item) {
          return { ...item, order: index };
        }
        return null;
      }).filter(Boolean);

      await this.collections.homepageContent.updateOne(
        { type: 'main' },
        { 
          $set: { 
            'services.items': reorderedItems,
            updated_at: new Date()
          }
        }
      );

      res.status(200).json({
        success: true,
        message: 'Services reordered successfully'
      });
    } catch (error) {
      console.error('❌ Reorder services error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder services'
      });
    }
  }

  /**
   * Get default content structure matching current mockdata
   */
  _getDefaultContent() {
    return {
      type: 'main',
      hero: {
        heading: 'Transform Your Body,',
        headingHighlight: ' Transform Your Life',
        description: 'Get personalized training, nutrition plans, and dedicated support from a passionate, certified personal trainer. Start your fitness journey with someone committed to helping you achieve your goals.',
        stats: [
          { id: uuidv4(), icon: 'Trophy', title: 'Certified', subtitle: 'Personal Trainer' },
          { id: uuidv4(), icon: 'Users', title: 'Passionate', subtitle: 'About Fitness' },
          { id: uuidv4(), icon: 'Star', title: 'Dedicated', subtitle: 'To Your Success' }
        ],
        ctaPrimary: 'Start Your Transformation',
        ctaSecondary: 'View Services',
        trustText: 'Start your transformation journey with personalized support',
        profileImage: 'https://customer-assets.emergentagent.com/job_simonfitcoach/artifacts/sbmcvjkm_IMG_0200.JPEG',
        profileCaption: 'Personal Training',
        profileSubcaption: 'Your Success, My Mission'
      },
      services: {
        heading: 'Complete Fitness Transformation',
        description: 'Everything you need to achieve your fitness goals in one comprehensive package. No guesswork, no confusion - just proven systems that deliver real results.',
        items: [
          {
            id: uuidv4(),
            icon: 'Dumbbell',
            title: 'Exercise Plans',
            description: 'Personalized workout routines tailored to your fitness level, goals, and available equipment.',
            features: ['Custom workout design', 'Progressive overload', 'Form guidance'],
            order: 0
          },
          {
            id: uuidv4(),
            icon: 'Apple',
            title: 'Nutrition Plans',
            description: 'Science-based meal plans that complement your training and accelerate your results.',
            features: ['Macro calculation', 'Meal prep guidance', 'Supplement advice'],
            order: 1
          },
          {
            id: uuidv4(),
            icon: 'MessageCircle',
            title: 'Coach in Your Pocket',
            description: '24/7 access to me for any questions, concerns, or motivation you need along your journey.',
            features: ['Instant messaging', 'Quick responses', 'Always available'],
            order: 2
          },
          {
            id: uuidv4(),
            icon: 'Calendar',
            title: 'Weekly Reviews & Check-Ins',
            description: 'Regular progress assessments and plan adjustments to keep you on track toward your goals.',
            features: ['Progress tracking', 'Plan modifications', 'Goal reassessment'],
            order: 3
          },
          {
            id: uuidv4(),
            icon: 'Video',
            title: 'Video Reviews',
            description: 'Submit exercise videos for form correction and technique improvement feedback.',
            features: ['Form analysis', 'Technique tips', 'Injury prevention'],
            order: 4
          },
          {
            id: uuidv4(),
            icon: 'Target',
            title: 'Help with Discipline',
            description: 'Accountability systems and strategies to build lasting fitness habits and consistency.',
            features: ['Habit formation', 'Accountability', 'Consistency building'],
            order: 5
          },
          {
            id: uuidv4(),
            icon: 'Zap',
            title: 'Help with Motivation',
            description: 'Personalized motivation strategies to keep you energized and committed to your goals.',
            features: ['Motivational support', 'Mindset coaching', 'Goal visualization'],
            order: 6
          },
          {
            id: uuidv4(),
            icon: 'TrendingUp',
            title: 'Goal Setting & Progress Tracking',
            description: 'Strategic goal planning with detailed tracking systems to monitor your transformation.',
            features: ['SMART goals', 'Progress metrics', 'Milestone celebrations'],
            order: 7
          },
          {
            id: uuidv4(),
            icon: 'Smartphone',
            title: 'Full Access to My App',
            description: 'Complete access to my exclusive training app with workouts, nutrition, and progress tools.',
            features: ['Exercise library', 'Meal tracking', 'Progress photos'],
            order: 8
          }
        ],
        ctaHeading: 'Ready to Start Your Transformation?',
        ctaDescription: 'Get access to all these services in one comprehensive package designed to guarantee your success.',
        ctaButton: 'Get Started Today'
      },
      about: {
        heading: 'Meet Simon Price',
        subheading: 'Your Partner in Transformation',
        paragraph1: 'As a certified personal trainer with a passion for fitness and helping others, I believe that everyone deserves to feel confident, strong, and healthy in their own body.',
        paragraph2: 'My approach goes beyond just exercise and nutrition. I focus on building sustainable habits, providing unwavering support, and creating personalized strategies that fit your lifestyle. Your success is my mission, and I\'m here to guide you every step of the way.',
        values: [
          { id: uuidv4(), value: 'Fresh Start', subtitle: 'New Perspective' },
          { id: uuidv4(), value: 'Certified', subtitle: 'Professional Training' },
          { id: uuidv4(), value: 'Dedicated', subtitle: 'To Your Goals' },
          { id: uuidv4(), value: 'Passionate', subtitle: 'About Fitness' }
        ],
        qualificationsHeading: 'Qualifications & Commitment',
        qualifications: [
          { id: uuidv4(), text: 'Certified Personal Trainer' },
          { id: uuidv4(), text: 'Nutrition Guidance Qualified' },
          { id: uuidv4(), text: 'Committed to Continued Learning' },
          { id: uuidv4(), text: 'Focused on Client Success' }
        ],
        profileName: 'Simon Price',
        profileTitle: 'Certified Personal Trainer',
        profileImage: 'https://customer-assets.emergentagent.com/job_simonfitcoach/artifacts/sbmcvjkm_IMG_0200.JPEG',
        profileStats: [
          { id: uuidv4(), label: 'Commitment Level', value: '100%' },
          { id: uuidv4(), label: 'Passion for Fitness', value: 'MAX' },
          { id: uuidv4(), label: 'Dedication to You', value: 'Always' }
        ],
        profileQuote: '"Ready to help you achieve your fitness goals"'
      },
      contact: {
        heading: 'Start Your Transformation Today',
        description: 'Ready to transform your body and life? Get in touch for a free consultation and let\'s create a personalized plan that gets you the results you deserve.',
        formHeading: 'Get Your Free Consultation',
        formDescription: 'Fill out the form below and I\'ll get back to you within 24 hours with a personalized plan tailored to your goals.',
        formButtonText: 'Get My Free Consultation',
        contactHeading: 'Get In Touch',
        phone: '+44 7471 931 170',
        email: 'simon.price@simonpricept.com',
        location: 'Bognor Regis, West Sussex, UK',
        trustBadgesHeading: 'Why Choose Simon Price PT?',
        trustBadges: [
          { id: uuidv4(), icon: 'Clock', title: '24-Hour Response', description: 'I respond to all inquiries within 24 hours' },
          { id: uuidv4(), icon: 'Shield', title: 'Proven Results', description: 'Huge success rate with happy clients' },
          { id: uuidv4(), icon: 'CheckCircle', title: 'Personalized Approach', description: 'Every plan is tailored to your unique goals' }
        ],
        specialOffer: {
          heading: 'Limited Time Offer',
          description: 'Get your first consultation absolutely FREE + receive a complimentary nutrition guide worth £50!',
          footnote: '*Valid for new clients only'
        },
        fitnessGoals: [
          { value: 'weight-loss', label: 'Weight Loss' },
          { value: 'muscle-gain', label: 'Muscle Gain' },
          { value: 'strength', label: 'Increase Strength' },
          { value: 'endurance', label: 'Improve Endurance' },
          { value: 'general', label: 'General Fitness' },
          { value: 'other', label: 'Other' }
        ],
        experienceLevels: [
          { value: 'beginner', label: 'Beginner (0-1 years)' },
          { value: 'intermediate', label: 'Intermediate (1-3 years)' },
          { value: 'advanced', label: 'Advanced (3+ years)' }
        ]
      }
    };
  }
}

module.exports = HomepageController;
