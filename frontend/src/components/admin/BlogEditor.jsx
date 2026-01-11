import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, Save, Eye, EyeOff, Image, Upload, X, Plus, 
  Calendar, Clock, Tag, FolderOpen, AlignLeft, AlignRight, Square, Maximize
} from 'lucide-react';
import AlertModal from '../AlertModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const BlogEditor = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEditing = !!slug;
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [imageInsertModal, setImageInsertModal] = useState({ show: false, url: '', position: 'original' });

  const [post, setPost] = useState({
    title: '',
    slug: '',
    content: '',
    header_image: '',
    category_slug: '',
    tags: [],
    author: '',
    status: 'draft',
    scheduled_date: '',
    seo_title: '',
    seo_description: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchTags();
    if (isEditing) {
      fetchPost();
    } else {
      // Get admin name for default author
      const adminEmail = localStorage.getItem('adminEmail') || 'Simon Price';
      setPost(p => ({ ...p, author: adminEmail.split('@')[0] || 'Simon Price' }));
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}/api/blog/admin/posts/${slug}`);
      if (response.data.success) {
        const fetchedPost = response.data.post;
        setPost({
          ...fetchedPost,
          scheduled_date: fetchedPost.scheduled_date 
            ? new Date(fetchedPost.scheduled_date).toISOString().slice(0, 16)
            : ''
        });
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setAlertModal({
        show: true,
        title: 'Error',
        message: 'Failed to load post',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}/api/blog/categories`);
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}/api/blog/tags`);
      if (response.data.success) {
        setAvailableTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setPost(p => ({
      ...p,
      title,
      slug: isEditing ? p.slug : generateSlug(title),
      seo_title: p.seo_title || title
    }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Don't set Content-Type header - axios will set it automatically with boundary
      const response = await axiosInstance.post(
        `${BACKEND_URL}/api/blog/admin/upload`,
        formData
      );

      if (response.data.success) {
        return response.data.url;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setAlertModal({
        show: true,
        title: 'Upload Error',
        message: error.response?.data?.message || 'Failed to upload image. Please try again.',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
    return null;
  };

  const handleHeaderImageUpload = async (e) => {
    const file = e.target.files[0];
    const url = await handleImageUpload(file);
    if (url) {
      setPost(p => ({ ...p, header_image: url }));
    }
  };

  // Handle drag and drop for content images
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const url = await handleImageUpload(file);
        if (url) {
          setImageInsertModal({ show: true, url, position: 'original' });
        }
      }
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const insertImageIntoContent = () => {
    const { url, position } = imageInsertModal;
    let altText = 'Image description';
    
    if (position !== 'original') {
      altText += `|${position}`;
    }
    
    const imageMarkdown = `\n![${altText}](${url})\n`;
    
    // Insert at cursor position or at end
    const textarea = editorRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = post.content;
      const newContent = content.substring(0, start) + imageMarkdown + content.substring(end);
      setPost(p => ({ ...p, content: newContent }));
    } else {
      setPost(p => ({ ...p, content: p.content + imageMarkdown }));
    }
    
    setImageInsertModal({ show: false, url: '', position: 'original' });
  };

  const handleSave = async (publishStatus = post.status) => {
    // Validation
    if (!post.title.trim()) {
      setAlertModal({ show: true, title: 'Error', message: 'Title is required', type: 'error' });
      return;
    }
    if (!post.content.trim()) {
      setAlertModal({ show: true, title: 'Error', message: 'Content is required', type: 'error' });
      return;
    }
    if (!post.header_image) {
      setAlertModal({ show: true, title: 'Error', message: 'Header image is required', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const postData = {
        ...post,
        status: publishStatus,
        new_slug: post.slug
      };

      if (isEditing) {
        await axiosInstance.put(`${BACKEND_URL}/api/blog/admin/posts/${slug}`, postData);
      } else {
        await axiosInstance.post(`${BACKEND_URL}/api/blog/admin/posts`, postData);
      }

      setAlertModal({
        show: true,
        title: 'Success',
        message: publishStatus === 'published' 
          ? 'Post published successfully!' 
          : 'Post saved successfully!',
        type: 'success'
      });

      // Navigate back to blog management after short delay
      setTimeout(() => navigate('/admin/blog'), 1500);
    } catch (error) {
      console.error('Error saving post:', error);
      setAlertModal({
        show: true,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save post',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const response = await axiosInstance.post(`${BACKEND_URL}/api/blog/admin/categories`, {
        name: newCategory.trim()
      });
      
      if (response.data.success) {
        setCategories([...categories, response.data.category]);
        setPost(p => ({ ...p, category_slug: response.data.category.slug }));
        setNewCategory('');
        setShowNewCategory(false);
      }
    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create category',
        type: 'error'
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      const response = await axiosInstance.post(`${BACKEND_URL}/api/blog/admin/tags`, {
        name: newTag.trim()
      });
      
      if (response.data.success) {
        setAvailableTags([...availableTags, response.data.tag]);
        setPost(p => ({ ...p, tags: [...p.tags, response.data.tag.slug] }));
        setNewTag('');
        setShowNewTag(false);
      }
    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create tag',
        type: 'error'
      });
    }
  };

  const toggleTag = (tagSlug) => {
    setPost(p => ({
      ...p,
      tags: p.tags.includes(tagSlug)
        ? p.tags.filter(t => t !== tagSlug)
        : [...p.tags, tagSlug]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/blog"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                Back
              </Link>
              <h1 className="text-xl font-bold text-white">
                {isEditing ? 'Edit Post' : 'New Post'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showPreview 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={post.title}
                onChange={handleTitleChange}
                placeholder="Post title..."
                className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-2xl font-bold text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">URL Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">/blog/</span>
                <input
                  type="text"
                  value={post.slug}
                  onChange={(e) => setPost(p => ({ ...p, slug: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Header Image */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Header Image *</label>
              {post.header_image ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img 
                    src={post.header_image} 
                    alt="Header" 
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => setPost(p => ({ ...p, header_image: '' }))}
                    className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="header-image-input"
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors block ${
                    uploading 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-gray-700 hover:border-cyan-500'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Upload size={48} className="mx-auto text-cyan-500 mb-4 animate-pulse" />
                      <p className="text-cyan-400">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Image size={48} className="mx-auto text-gray-500 mb-4" />
                      <p className="text-gray-400">Click to upload header image</p>
                      <p className="text-sm text-gray-500 mt-2">Recommended size: 1200x600</p>
                    </>
                  )}
                </label>
              )}
              <input
                id="header-image-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeaderImageUpload}
                className="hidden"
              />
            </div>

            {/* Content Editor / Preview */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Content (Markdown) - Drag & drop images to insert
              </label>
              {showPreview ? (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 min-h-[400px] prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {post.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  ref={editorRef}
                  value={post.content}
                  onChange={(e) => setPost(p => ({ ...p, content: e.target.value }))}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  placeholder="Write your post content in Markdown..."
                  className="w-full h-[500px] px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono text-sm resize-none"
                />
              )}
              {uploading && (
                <div className="mt-2 text-cyan-400 flex items-center gap-2">
                  <Upload size={16} className="animate-pulse" />
                  Uploading image...
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="font-bold text-white mb-4">Status</h3>
              <select
                value={post.status}
                onChange={(e) => setPost(p => ({ ...p, status: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="hidden">Hidden</option>
              </select>

              {post.status === 'scheduled' && (
                <div className="mt-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Publish Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={post.scheduled_date}
                    onChange={(e) => setPost(p => ({ ...p, scheduled_date: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Category */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <FolderOpen size={18} />
                Category
              </h3>
              <select
                value={post.category_slug}
                onChange={(e) => setPost(p => ({ ...p, category_slug: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              
              {showNewCategory ? (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleCreateCategory}
                    className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowNewCategory(false); setNewCategory(''); }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewCategory(true)}
                  className="mt-3 text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add New Category
                </button>
              )}
            </div>

            {/* Tags */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Tag size={18} />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {availableTags.map((tag) => (
                  <button
                    key={tag.slug}
                    onClick={() => toggleTag(tag.slug)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      post.tags.includes(tag.slug)
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              
              {showNewTag ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New tag name"
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleCreateTag}
                    className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowNewTag(false); setNewTag(''); }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewTag(true)}
                  className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add New Tag
                </button>
              )}
            </div>

            {/* Author */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="font-bold text-white mb-4">Author</h3>
              <input
                type="text"
                value={post.author}
                onChange={(e) => setPost(p => ({ ...p, author: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* SEO */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="font-bold text-white mb-4">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">SEO Title</label>
                  <input
                    type="text"
                    value={post.seo_title}
                    onChange={(e) => setPost(p => ({ ...p, seo_title: e.target.value }))}
                    placeholder="Page title for search engines"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{post.seo_title.length}/60 characters</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Meta Description</label>
                  <textarea
                    value={post.seo_description}
                    onChange={(e) => setPost(p => ({ ...p, seo_description: e.target.value }))}
                    placeholder="Brief description for search results"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{post.seo_description.length}/160 characters</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Insert Modal */}
      {imageInsertModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Insert Image</h3>
            
            <div className="mb-4">
              <img 
                src={imageInsertModal.url} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Image Position</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'left', icon: AlignLeft, label: 'Left' },
                  { value: 'right', icon: AlignRight, label: 'Right' },
                  { value: 'square', icon: Square, label: 'Square' },
                  { value: 'original', icon: Maximize, label: 'Full' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setImageInsertModal(m => ({ ...m, position: value }))}
                    className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                      imageInsertModal.position === value
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setImageInsertModal({ show: false, url: '', position: 'original' })}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={insertImageIntoContent}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        show={alertModal.show}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ show: false, title: '', message: '', type: 'info' })}
      />
    </div>
  );
};

export default BlogEditor;
