import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, ArrowLeft, Calendar, Clock } from 'lucide-react';
import AlertModal from '../AlertModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const BlogManagement = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    category: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, slug: '', title: '' });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [currentPage, filters]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 20);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await axiosInstance.get(`${BACKEND_URL}/api/blog/admin/posts?${params}`);
      if (response.data.success) {
        setPosts(response.data.posts);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (error.response?.status === 401) {
        navigate('/admin');
      }
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

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`${BACKEND_URL}/api/blog/admin/posts/${deleteConfirm.slug}`);
      setAlertModal({
        show: true,
        title: 'Success',
        message: 'Post deleted successfully',
        type: 'success'
      });
      fetchPosts();
    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Error',
        message: 'Failed to delete post',
        type: 'error'
      });
    } finally {
      setDeleteConfirm({ show: false, slug: '', title: '' });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      published: 'bg-green-500/20 text-green-400 border-green-500/30',
      draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      hidden: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return badges[status] || badges.draft;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                Dashboard
              </Link>
              <h1 className="text-xl font-bold text-white">Blog Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/admin/blog/categories"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Manage Categories
              </Link>
              <Link
                to="/admin/blog/new"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                New Post
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent mx-auto"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-bold text-white mb-2">No posts found</h3>
              <p className="text-gray-400 mb-6">Get started by creating your first blog post.</p>
              <Link
                to="/admin/blog/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                Create First Post
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Post</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {posts.map((post) => (
                    <tr key={post.slug} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {post.header_image && (
                            <img
                              src={post.header_image}
                              alt={post.title}
                              className="w-16 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h3 className="font-medium text-white">{post.title}</h3>
                            <p className="text-sm text-gray-400">/blog/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">
                          {categories.find(c => c.slug === post.category_slug)?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(post.status)}`}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{post.author}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-300">{formatDate(post.publish_date || post.created_at)}</div>
                          {post.scheduled_date && post.status === 'scheduled' && (
                            <div className="text-blue-400 flex items-center gap-1 mt-1">
                              <Clock size={12} />
                              Scheduled: {formatDate(post.scheduled_date)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === 'published' && (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                              title="View Post"
                            >
                              <Eye size={18} />
                            </a>
                          )}
                          <Link
                            to={`/admin/blog/edit/${post.slug}`}
                            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                            title="Edit Post"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm({ show: true, slug: post.slug, title: post.title })}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalPosts} posts)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Delete Post</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm({ show: false, slug: '', title: '' })}
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

export default BlogManagement;
