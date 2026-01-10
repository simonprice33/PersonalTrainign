/**
 * Blog Controller
 * Handles all blog-related operations including posts, categories, and tags
 */

const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class BlogController {
  constructor(collections, config) {
    this.collections = collections;
    this.config = config;
    
    // Setup multer for image uploads
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../frontend/public/images/blog-images');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `blog-${uniqueSuffix}${ext}`);
      }
    });

    this.upload = multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
          return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
      }
    });
  }

  // ==================== BLOG POSTS ====================

  /**
   * Get all blog posts (public - only published)
   */
  async getPublicPosts(req, res) {
    try {
      const { page = 1, limit = 12, category, tag, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build query for published posts
      const now = new Date();
      const query = {
        status: 'published',
        $or: [
          { scheduled_date: { $exists: false } },
          { scheduled_date: null },
          { scheduled_date: { $lte: now } }
        ]
      };

      // Filter by category
      if (category) {
        query.category_slug = category;
      }

      // Filter by tag
      if (tag) {
        query.tags = { $in: [tag] };
      }

      // Search by title (partial match)
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      const [posts, total] = await Promise.all([
        this.collections.blogPosts
          .find(query, { projection: { _id: 0 } })
          .sort({ publish_date: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray(),
        this.collections.blogPosts.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.status(200).json({
        success: true,
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts: total,
          hasMore: parseInt(page) < totalPages
        }
      });
    } catch (error) {
      console.error('❌ Get public posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog posts'
      });
    }
  }

  /**
   * Get single blog post by slug (public)
   */
  async getPublicPostBySlug(req, res) {
    try {
      const { slug } = req.params;
      const now = new Date();

      const post = await this.collections.blogPosts.findOne({
        slug,
        status: 'published',
        $or: [
          { scheduled_date: { $exists: false } },
          { scheduled_date: null },
          { scheduled_date: { $lte: now } }
        ]
      }, { projection: { _id: 0 } });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      // Get category details
      if (post.category_slug) {
        const category = await this.collections.blogCategories.findOne(
          { slug: post.category_slug },
          { projection: { _id: 0 } }
        );
        post.category = category;
      }

      res.status(200).json({
        success: true,
        post
      });
    } catch (error) {
      console.error('❌ Get post by slug error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog post'
      });
    }
  }

  /**
   * Get all blog posts (admin - all statuses)
   */
  async getAdminPosts(req, res) {
    try {
      const { page = 1, limit = 20, status, category, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (category) {
        query.category_slug = category;
      }

      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      const [posts, total] = await Promise.all([
        this.collections.blogPosts
          .find(query, { projection: { _id: 0 } })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray(),
        this.collections.blogPosts.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.status(200).json({
        success: true,
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts: total
        }
      });
    } catch (error) {
      console.error('❌ Get admin posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog posts'
      });
    }
  }

  /**
   * Get single blog post for editing (admin)
   */
  async getAdminPostBySlug(req, res) {
    try {
      const { slug } = req.params;

      const post = await this.collections.blogPosts.findOne(
        { slug },
        { projection: { _id: 0 } }
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      res.status(200).json({
        success: true,
        post
      });
    } catch (error) {
      console.error('❌ Get admin post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog post'
      });
    }
  }

  /**
   * Create new blog post
   */
  async createPost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        title,
        slug,
        content,
        header_image,
        category_slug,
        tags,
        author,
        status,
        scheduled_date,
        seo_title,
        seo_description
      } = req.body;

      // Check if slug already exists
      const existingPost = await this.collections.blogPosts.findOne({ slug });
      if (existingPost) {
        return res.status(409).json({
          success: false,
          message: 'A post with this slug already exists'
        });
      }

      const post = {
        title,
        slug: slug || this.generateSlug(title),
        content,
        header_image,
        category_slug: category_slug || null,
        tags: tags || [],
        author: author || req.user.name || req.user.email,
        status: status || 'draft',
        publish_date: status === 'published' ? new Date() : null,
        scheduled_date: scheduled_date ? new Date(scheduled_date) : null,
        seo_title: seo_title || title,
        seo_description: seo_description || '',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: req.user.email
      };

      await this.collections.blogPosts.insertOne(post);

      console.log(`✅ Blog post created: ${title}`);

      res.status(201).json({
        success: true,
        message: 'Blog post created successfully',
        post: { ...post, _id: undefined }
      });
    } catch (error) {
      console.error('❌ Create post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create blog post'
      });
    }
  }

  /**
   * Update blog post
   */
  async updatePost(req, res) {
    try {
      const { slug } = req.params;
      const {
        title,
        new_slug,
        content,
        header_image,
        category_slug,
        tags,
        author,
        status,
        scheduled_date,
        seo_title,
        seo_description
      } = req.body;

      const existingPost = await this.collections.blogPosts.findOne({ slug });
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      // Check if new slug conflicts with another post
      if (new_slug && new_slug !== slug) {
        const slugConflict = await this.collections.blogPosts.findOne({ slug: new_slug });
        if (slugConflict) {
          return res.status(409).json({
            success: false,
            message: 'A post with this slug already exists'
          });
        }
      }

      const updateData = {
        title: title || existingPost.title,
        slug: new_slug || slug,
        content: content !== undefined ? content : existingPost.content,
        header_image: header_image || existingPost.header_image,
        category_slug: category_slug !== undefined ? category_slug : existingPost.category_slug,
        tags: tags !== undefined ? tags : existingPost.tags,
        author: author || existingPost.author,
        status: status || existingPost.status,
        scheduled_date: scheduled_date ? new Date(scheduled_date) : existingPost.scheduled_date,
        seo_title: seo_title !== undefined ? seo_title : existingPost.seo_title,
        seo_description: seo_description !== undefined ? seo_description : existingPost.seo_description,
        updated_at: new Date()
      };

      // Set publish date if transitioning to published
      if (status === 'published' && existingPost.status !== 'published') {
        updateData.publish_date = new Date();
      }

      await this.collections.blogPosts.updateOne(
        { slug },
        { $set: updateData }
      );

      console.log(`✅ Blog post updated: ${title}`);

      res.status(200).json({
        success: true,
        message: 'Blog post updated successfully',
        post: updateData
      });
    } catch (error) {
      console.error('❌ Update post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update blog post'
      });
    }
  }

  /**
   * Delete blog post
   */
  async deletePost(req, res) {
    try {
      const { slug } = req.params;

      const result = await this.collections.blogPosts.deleteOne({ slug });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      console.log(`✅ Blog post deleted: ${slug}`);

      res.status(200).json({
        success: true,
        message: 'Blog post deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete blog post'
      });
    }
  }

  // ==================== CATEGORIES ====================

  /**
   * Get all categories (public)
   */
  async getCategories(req, res) {
    try {
      const categories = await this.collections.blogCategories
        .find({}, { projection: { _id: 0 } })
        .sort({ name: 1 })
        .toArray();

      // Get post count for each category
      for (let category of categories) {
        const count = await this.collections.blogPosts.countDocuments({
          category_slug: category.slug,
          status: 'published'
        });
        category.post_count = count;
      }

      res.status(200).json({
        success: true,
        categories
      });
    } catch (error) {
      console.error('❌ Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories'
      });
    }
  }

  /**
   * Create category
   */
  async createCategory(req, res) {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }

      const slug = this.generateSlug(name);

      // Check if category exists
      const existing = await this.collections.blogCategories.findOne({ slug });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Category already exists'
        });
      }

      const category = {
        name,
        slug,
        created_at: new Date()
      };

      await this.collections.blogCategories.insertOne(category);

      console.log(`✅ Category created: ${name}`);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category: { name, slug }
      });
    } catch (error) {
      console.error('❌ Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create category'
      });
    }
  }

  /**
   * Update category
   */
  async updateCategory(req, res) {
    try {
      const { slug } = req.params;
      const { name } = req.body;

      const existing = await this.collections.blogCategories.findOne({ slug });
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const newSlug = this.generateSlug(name);

      // Update category
      await this.collections.blogCategories.updateOne(
        { slug },
        { $set: { name, slug: newSlug, updated_at: new Date() } }
      );

      // Update all posts with this category
      await this.collections.blogPosts.updateMany(
        { category_slug: slug },
        { $set: { category_slug: newSlug } }
      );

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        category: { name, slug: newSlug }
      });
    } catch (error) {
      console.error('❌ Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category'
      });
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(req, res) {
    try {
      const { slug } = req.params;

      // Check if category has posts
      const postCount = await this.collections.blogPosts.countDocuments({ category_slug: slug });
      if (postCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category with ${postCount} posts. Please reassign posts first.`
        });
      }

      const result = await this.collections.blogCategories.deleteOne({ slug });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category'
      });
    }
  }

  // ==================== TAGS ====================

  /**
   * Get all tags (public)
   */
  async getTags(req, res) {
    try {
      const tags = await this.collections.blogTags
        .find({}, { projection: { _id: 0 } })
        .sort({ name: 1 })
        .toArray();

      // Get post count for each tag
      for (let tag of tags) {
        const count = await this.collections.blogPosts.countDocuments({
          tags: tag.slug,
          status: 'published'
        });
        tag.post_count = count;
      }

      res.status(200).json({
        success: true,
        tags
      });
    } catch (error) {
      console.error('❌ Get tags error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tags'
      });
    }
  }

  /**
   * Create tag
   */
  async createTag(req, res) {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Tag name is required'
        });
      }

      const slug = this.generateSlug(name);

      // Check if tag exists
      const existing = await this.collections.blogTags.findOne({ slug });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Tag already exists'
        });
      }

      const tag = {
        name,
        slug,
        created_at: new Date()
      };

      await this.collections.blogTags.insertOne(tag);

      console.log(`✅ Tag created: ${name}`);

      res.status(201).json({
        success: true,
        message: 'Tag created successfully',
        tag: { name, slug }
      });
    } catch (error) {
      console.error('❌ Create tag error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create tag'
      });
    }
  }

  /**
   * Delete tag
   */
  async deleteTag(req, res) {
    try {
      const { slug } = req.params;

      // Remove tag from all posts
      await this.collections.blogPosts.updateMany(
        { tags: slug },
        { $pull: { tags: slug } }
      );

      const result = await this.collections.blogTags.deleteOne({ slug });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tag not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tag deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete tag error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete tag'
      });
    }
  }

  // ==================== IMAGE UPLOAD ====================

  /**
   * Upload blog image
   */
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const imageUrl = `/images/blog-images/${req.file.filename}`;

      console.log(`✅ Blog image uploaded: ${req.file.filename}`);

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        url: imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('❌ Upload image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image'
      });
    }
  }

  /**
   * Delete blog image
   */
  async deleteImage(req, res) {
    try {
      const { filename } = req.params;
      const imagePath = path.join(__dirname, '../../frontend/public/images/blog-images', filename);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`✅ Blog image deleted: ${filename}`);
      }

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image'
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

module.exports = BlogController;
