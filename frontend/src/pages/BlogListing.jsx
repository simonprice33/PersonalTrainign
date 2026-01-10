import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, ChevronLeft, ChevronRight, Calendar, User, Tag, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const BlogListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchTags();
  }, [currentPage, selectedCategory, selectedTag, searchTerm]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 12);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedTag) params.append('tag', selectedTag);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`${BACKEND_URL}/api/blog/posts?${params}`);
      if (response.data.success) {
        setPosts(response.data.posts);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/blog/categories`);
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/blog/tags`);
      if (response.data.success) {
        setTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search: searchTerm, page: 1 });
  };

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handleCategorySelect = (categorySlug) => {
    setSelectedCategory(categorySlug);
    updateFilters({ category: categorySlug, page: 1 });
    setMobileFiltersOpen(false);
  };

  const handleTagSelect = (tagSlug) => {
    setSelectedTag(tagSlug);
    updateFilters({ tag: tagSlug, page: 1 });
    setMobileFiltersOpen(false);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTag('');
    setSearchTerm('');
    setSearchParams({});
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const Sidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'p-4' : ''}`}>
      {/* Categories */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FolderOpen size={20} className="text-cyan-400" />
          Categories
        </h3>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => handleCategorySelect('')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                !selectedCategory
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              All Categories
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <button
                onClick={() => handleCategorySelect(category.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                  selectedCategory === category.slug
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <span>{category.name}</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                  {category.post_count || 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Tag size={20} className="text-cyan-400" />
          Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.slug}
              onClick={() => handleTagSelect(tag.slug)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTag === tag.slug
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedCategory || selectedTag || searchTerm) && (
        <button
          onClick={clearFilters}
          className="mt-6 w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-white">Simon Price PT</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link to="/blog" className="text-cyan-400 font-medium">Blog</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Fitness Blog</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Expert tips, workout guides, and nutrition advice to help you achieve your fitness goals.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="w-full px-6 py-4 pl-12 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filters Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="w-full px-4 py-3 bg-gray-800 rounded-lg flex items-center justify-between text-white"
            >
              <span className="flex items-center gap-2">
                <FolderOpen size={20} />
                Filters & Categories
              </span>
              {mobileFiltersOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {mobileFiltersOpen && (
              <div className="mt-2 bg-gray-800 rounded-lg border border-gray-700">
                <Sidebar isMobile />
              </div>
            )}
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 sticky top-24">
              <Sidebar />
            </div>
          </aside>

          {/* Posts Grid */}
          <main className="flex-1">
            {/* Active Filters */}
            {(selectedCategory || selectedTag || searchTerm) && (
              <div className="mb-6 flex flex-wrap gap-2 items-center">
                <span className="text-gray-400">Active filters:</span>
                {selectedCategory && (
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm flex items-center gap-2">
                    Category: {categories.find(c => c.slug === selectedCategory)?.name}
                    <button onClick={() => handleCategorySelect('')}>&times;</button>
                  </span>
                )}
                {selectedTag && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-2">
                    Tag: {tags.find(t => t.slug === selectedTag)?.name}
                    <button onClick={() => handleTagSelect('')}>&times;</button>
                  </span>
                )}
                {searchTerm && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-2">
                    Search: "{searchTerm}"
                    <button onClick={() => { setSearchTerm(''); updateFilters({ search: '' }); }}>&times;</button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-700"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
                      <div className="h-6 bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-white mb-2">No posts found</h3>
                <p className="text-gray-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="group bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-[1.02]"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.header_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {post.category_slug && (
                          <span className="absolute top-4 left-4 px-3 py-1 bg-cyan-500 text-white text-xs font-medium rounded-full">
                            {categories.find(c => c.slug === post.category_slug)?.name || post.category_slug}
                          </span>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(post.publish_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {post.author}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        {post.seo_description && (
                          <p className="text-gray-400 text-sm line-clamp-2">{post.seo_description}</p>
                        )}
                        {post.tags && post.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-2">
                    <button
                      onClick={() => updateFilters({ page: currentPage - 1 })}
                      disabled={currentPage === 1}
                      className="p-2 bg-gray-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => updateFilters({ page: i + 1 })}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          currentPage === i + 1
                            ? 'bg-cyan-500 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => updateFilters({ page: currentPage + 1 })}
                      disabled={currentPage === pagination.totalPages}
                      className="p-2 bg-gray-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default BlogListing;
