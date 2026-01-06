/**
 * Package Controller - Manages coaching packages, PARQ and health questions
 */

class PackageController {
  constructor(collections, stripe, config) {
    this.collections = collections;
    this.stripe = stripe;
    this.config = config;
  }

  // ==================== PACKAGES ====================

  /**
   * Get all packages (public)
   */
  async getPackages(req, res) {
    try {
      const packages = await this.collections.packages
        .find({ active: true }, { _id: 0 })
        .sort({ price: 1 })
        .toArray();

      res.json({
        success: true,
        packages
      });
    } catch (error) {
      console.error('❌ Get packages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch packages'
      });
    }
  }

  /**
   * Get all packages (admin)
   */
  async getAllPackages(req, res) {
    try {
      const packages = await this.collections.packages
        .find({}, { _id: 0 })
        .sort({ price: 1 })
        .toArray();

      res.json({
        success: true,
        packages
      });
    } catch (error) {
      console.error('❌ Get all packages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch packages'
      });
    }
  }

  /**
   * Create package (admin)
   */
  async createPackage(req, res) {
    try {
      const { name, price, description, features } = req.body;

      const packageData = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        price: parseFloat(price),
        description,
        features: Array.isArray(features) ? features : [],
        active: true,
        created_at: new Date()
      };

      await this.collections.packages.insertOne(packageData);

      res.json({
        success: true,
        message: 'Package created successfully',
        package: packageData
      });
    } catch (error) {
      console.error('❌ Create package error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create package'
      });
    }
  }

  /**
   * Update package (admin)
   */
  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const { name, price, description, features, active } = req.body;

      const updateData = {
        ...(name && { name }),
        ...(price && { price: parseFloat(price) }),
        ...(description && { description }),
        ...(features && { features: Array.isArray(features) ? features : [] }),
        ...(active !== undefined && { active }),
        updated_at: new Date()
      };

      await this.collections.packages.updateOne(
        { id },
        { $set: updateData }
      );

      res.json({
        success: true,
        message: 'Package updated successfully'
      });
    } catch (error) {
      console.error('❌ Update package error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update package'
      });
    }
  }

  /**
   * Delete package (admin)
   */
  async deletePackage(req, res) {
    try {
      const { id } = req.params;

      await this.collections.packages.deleteOne({ id });

      res.json({
        success: true,
        message: 'Package deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete package error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete package'
      });
    }
  }

  // ==================== PARQ QUESTIONS ====================

  /**
   * Get active PARQ questions (public)
   */
  async getParqQuestions(req, res) {
    try {
      const questions = await this.collections.parqQuestions
        .find({ active: true }, { _id: 0 })
        .sort({ order: 1 })
        .toArray();

      res.json({
        success: true,
        questions
      });
    } catch (error) {
      console.error('❌ Get PARQ questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch PARQ questions'
      });
    }
  }

  /**
   * Get all PARQ questions (admin)
   */
  async getAllParqQuestions(req, res) {
    try {
      const questions = await this.collections.parqQuestions
        .find({}, { _id: 0 })
        .sort({ order: 1 })
        .toArray();

      res.json({
        success: true,
        questions
      });
    } catch (error) {
      console.error('❌ Get all PARQ questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch PARQ questions'
      });
    }
  }

  /**
   * Create PARQ question (admin)
   */
  async createParqQuestion(req, res) {
    try {
      const { question } = req.body;

      // Get max order
      const maxOrder = await this.collections.parqQuestions
        .find()
        .sort({ order: -1 })
        .limit(1)
        .toArray();

      const order = maxOrder.length > 0 ? maxOrder[0].order + 1 : 1;

      const questionData = {
        id: `parq-${Date.now()}`,
        question,
        order,
        active: true,
        created_at: new Date()
      };

      await this.collections.parqQuestions.insertOne(questionData);

      res.json({
        success: true,
        message: 'PARQ question created successfully',
        question: questionData
      });
    } catch (error) {
      console.error('❌ Create PARQ question error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create PARQ question'
      });
    }
  }

  /**
   * Update PARQ question (admin)
   */
  async updateParqQuestion(req, res) {
    try {
      const { id } = req.params;
      const { question, active, order } = req.body;

      const updateData = {
        ...(question && { question }),
        ...(active !== undefined && { active }),
        ...(order && { order }),
        updated_at: new Date()
      };

      await this.collections.parqQuestions.updateOne(
        { id },
        { $set: updateData }
      );

      res.json({
        success: true,
        message: 'PARQ question updated successfully'
      });
    } catch (error) {
      console.error('❌ Update PARQ question error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update PARQ question'
      });
    }
  }

  /**
   * Delete PARQ question (admin)
   */
  async deleteParqQuestion(req, res) {
    try {
      const { id } = req.params;

      await this.collections.parqQuestions.deleteOne({ id });

      res.json({
        success: true,
        message: 'PARQ question deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete PARQ question error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete PARQ question'
      });
    }
  }

  // ==================== HEALTH QUESTIONS ====================

  /**
   * Get active health questions (public)
   */
  async getHealthQuestions(req, res) {
    try {
      const questions = await this.collections.healthQuestions
        .find({ active: true }, { _id: 0 })
        .sort({ order: 1 })
        .toArray();

      res.json({
        success: true,
        questions
      });
    } catch (error) {
      console.error('❌ Get health questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch health questions'
      });
    }
  }

  /**
   * Get all health questions (admin)
   */
  async getAllHealthQuestions(req, res) {
    try {
      const questions = await this.collections.healthQuestions
        .find({}, { _id: 0 })
        .sort({ order: 1 })
        .toArray();

      res.json({
        success: true,
        questions
      });
    } catch (error) {
      console.error('❌ Get all health questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch health questions'
      });
    }
  }

  /**
   * Create health question (admin)
   */
  async createHealthQuestion(req, res) {
    try {
      const { question, type, options } = req.body;

      // Get max order
      const maxOrder = await this.collections.healthQuestions
        .find()
        .sort({ order: -1 })
        .limit(1)
        .toArray();

      const order = maxOrder.length > 0 ? maxOrder[0].order + 1 : 1;

      const questionData = {
        id: `health-${Date.now()}`,
        question,
        type: type || 'text',
        options: Array.isArray(options) ? options : [],
        order,
        active: true,
        created_at: new Date()
      };

      await this.collections.healthQuestions.insertOne(questionData);

      res.json({
        success: true,
        message: 'Health question created successfully',
        question: questionData
      });
    } catch (error) {
      console.error('❌ Create health question error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create health question'
      });
    }
  }

  /**
   * Update health question (admin)
   */
  async updateHealthQuestion(req, res) {
    try {
      const { id } = req.params;
      const { question, type, options, active, order } = req.body;

      const updateData = {
        ...(question && { question }),
        ...(type && { type }),
        ...(options && { options: Array.isArray(options) ? options : [] }),
        ...(active !== undefined && { active }),
        ...(order && { order }),
        updated_at: new Date()
      };

      await this.collections.healthQuestions.updateOne(
        { id },
        { $set: updateData }
      );

      res.json({
        success: true,
        message: 'Health question updated successfully'
      });
    } catch (error) {
      console.error('❌ Update health question error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update health question'
      });
    }
  }

  /**
   * Delete health question (admin)
   */
  async deleteHealthQuestion(req, res) {
    try {
      const { id } = req.params;

      await this.collections.healthQuestions.deleteOne({ id });

      res.json({
        success: true,
        message: 'Health question deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete health question error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete health question'
      });
    }
  }
}

module.exports = PackageController;
