/**
 * Blog Routes
 */

const express = require('express');
const { body } = require('express-validator');

module.exports = (controller, authenticate) => {
  const router = express.Router();

  // ==================== PUBLIC ROUTES ====================

  // Get published blog posts (paginated)
  router.get('/posts', (req, res) => controller.getPublicPosts(req, res));

  // Get single published post by slug
  router.get('/posts/:slug', (req, res) => controller.getPublicPostBySlug(req, res));

  // Get all categories
  router.get('/categories', (req, res) => controller.getCategories(req, res));

  // Get all tags
  router.get('/tags', (req, res) => controller.getTags(req, res));

  // ==================== ADMIN ROUTES ====================

  // Get all posts (admin)
  router.get('/admin/posts', authenticate, (req, res) => controller.getAdminPosts(req, res));

  // Get single post for editing (admin)
  router.get('/admin/posts/:slug', authenticate, (req, res) => controller.getAdminPostBySlug(req, res));

  // Create new post
  router.post('/admin/posts', authenticate, [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('header_image').notEmpty().withMessage('Header image is required')
  ], (req, res) => controller.createPost(req, res));

  // Update post
  router.put('/admin/posts/:slug', authenticate, (req, res) => controller.updatePost(req, res));

  // Delete post
  router.delete('/admin/posts/:slug', authenticate, (req, res) => controller.deletePost(req, res));

  // Create category
  router.post('/admin/categories', authenticate, [
    body('name').notEmpty().withMessage('Category name is required')
  ], (req, res) => controller.createCategory(req, res));

  // Update category
  router.put('/admin/categories/:slug', authenticate, (req, res) => controller.updateCategory(req, res));

  // Delete category
  router.delete('/admin/categories/:slug', authenticate, (req, res) => controller.deleteCategory(req, res));

  // Create tag
  router.post('/admin/tags', authenticate, [
    body('name').notEmpty().withMessage('Tag name is required')
  ], (req, res) => controller.createTag(req, res));

  // Delete tag
  router.delete('/admin/tags/:slug', authenticate, (req, res) => controller.deleteTag(req, res));

  // Upload image
  router.post('/admin/upload', authenticate, controller.upload.single('image'), (req, res) => controller.uploadImage(req, res));

  // Delete image
  router.delete('/admin/images/:filename', authenticate, (req, res) => controller.deleteImage(req, res));

  return router;
};
