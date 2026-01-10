import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { ArrowLeft, Plus, Edit, Trash2, Tag, FolderOpen, X, Check } from 'lucide-react';
import AlertModal from '../AlertModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const BlogCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', slug: '', name: '' });

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}/api/blog/categories`);
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error.response?.status === 401) {
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}/api/blog/tags`);
      if (response.data.success) {
        setTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const response = await axiosInstance.post(`${BACKEND_URL}/api/blog/admin/categories`, {
        name: newCategory.trim()
      });
      
      if (response.data.success) {
        setCategories([...categories, response.data.category]);
        setNewCategory('');
        setAlertModal({
          show: true,
          title: 'Success',
          message: 'Category created successfully',
          type: 'success'
        });
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

  const handleUpdateCategory = async (slug) => {
    if (!editCategoryName.trim()) return;

    try {
      const response = await axiosInstance.put(`${BACKEND_URL}/api/blog/admin/categories/${slug}`, {
        name: editCategoryName.trim()
      });
      
      if (response.data.success) {
        setCategories(categories.map(c => 
          c.slug === slug ? response.data.category : c
        ));
        setEditingCategory(null);
        setEditCategoryName('');
        setAlertModal({
          show: true,
          title: 'Success',
          message: 'Category updated successfully',
          type: 'success'
        });
      }
    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update category',
        type: 'error'
      });
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    try {
      const response = await axiosInstance.post(`${BACKEND_URL}/api/blog/admin/tags`, {
        name: newTag.trim()
      });
      
      if (response.data.success) {
        setTags([...tags, response.data.tag]);
        setNewTag('');
        setAlertModal({
          show: true,
          title: 'Success',
          message: 'Tag created successfully',
          type: 'success'
        });
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

  const handleDelete = async () => {
    const { type, slug } = deleteConfirm;
    
    try {
      if (type === 'category') {
        await axiosInstance.delete(`${BACKEND_URL}/api/blog/admin/categories/${slug}`);
        setCategories(categories.filter(c => c.slug !== slug));
      } else {
        await axiosInstance.delete(`${BACKEND_URL}/api/blog/admin/tags/${slug}`);
        setTags(tags.filter(t => t.slug !== slug));
      }
      
      setAlertModal({
        show: true,
        title: 'Success',
        message: `${type === 'category' ? 'Category' : 'Tag'} deleted successfully`,
        type: 'success'
      });
    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Error',
        message: error.response?.data?.message || `Failed to delete ${type}`,
        type: 'error'
      });
    } finally {
      setDeleteConfirm({ show: false, type: '', slug: '', name: '' });
    }
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
                Back to Blog
              </Link>
              <h1 className="text-xl font-bold text-white">Categories & Tags</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FolderOpen size={24} className="text-cyan-400" />
              Categories
            </h2>

            {/* Add Category */}
            <form onSubmit={handleCreateCategory} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name..."
                  className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </form>

            {/* Categories List */}
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No categories yet</p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.slug}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                  >
                    {editingCategory === category.slug ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="flex-1 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateCategory(category.slug)}
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => { setEditingCategory(null); setEditCategoryName(''); }}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="font-medium text-white">{category.name}</h3>
                          <p className="text-sm text-gray-400">
                            {category.post_count || 0} posts • /{category.slug}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingCategory(category.slug); setEditCategoryName(category.name); }}
                            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ show: true, type: 'category', slug: category.slug, name: category.name })}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Tag size={24} className="text-purple-400" />
              Tags
            </h2>

            {/* Add Tag */}
            <form onSubmit={handleCreateTag} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="New tag name..."
                  className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </form>

            {/* Tags List */}
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-gray-400 text-center py-8 w-full">No tags yet</p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.slug}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-full border border-gray-700 group"
                  >
                    <span className="text-white">{tag.name}</span>
                    <span className="text-xs text-gray-400">({tag.post_count || 0})</span>
                    <button
                      onClick={() => setDeleteConfirm({ show: true, type: 'tag', slug: tag.slug, name: tag.name })}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">
              Delete {deleteConfirm.type === 'category' ? 'Category' : 'Tag'}
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "<strong>{deleteConfirm.name}</strong>"?
              {deleteConfirm.type === 'category' && (
                <span className="block mt-2 text-yellow-400 text-sm">
                  Note: You cannot delete a category that has posts assigned to it.
                </span>
              )}
              {deleteConfirm.type === 'tag' && (
                <span className="block mt-2 text-yellow-400 text-sm">
                  Note: This tag will be removed from all posts.
                </span>
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm({ show: false, type: '', slug: '', name: '' })}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete
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

export default BlogCategories;
