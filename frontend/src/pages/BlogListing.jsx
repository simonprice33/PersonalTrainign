import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Tag,
  FolderOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

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

  const didRestoreScrollRef = useRef(false);
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

  // ✅ Restore scroll to last viewed post (once)
  useEffect(() => {
    if (didRestoreScrollRef.current) return;
    if (loading) return;
    if (!posts || posts.length === 0) return;

    let slug = null;
    try {
      slug = sessionStorage.getItem('blog:lastViewedSlug');
    } catch {}

    if (!slug) return;

    const el = document.getElementById(`blog-card-${slug}`);
    if (!el) return;

    didRestoreScrollRef.current = true;

    try {
      sessionStorage.removeItem('blog:lastViewedSlug');
    } catch {}

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'auto', block: 'center' });
    });
  }, [loading, posts]);

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search: searchTerm, page: 1 });
  };

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
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

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const Sidebar = ({ isMobile = false }) => (
    <div className={isMobile ? 'p-4' : ''}>
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
              className={`w-full text-left px-3 py-2 rounded-lg ${
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
                className={`w-full text-left px-3 py-2 rounded-lg flex justify-between ${
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
              className={`px-3 py-1 rounded-full text-sm ${
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

      {(selectedCategory || selectedTag || searchTerm) && (
        <button
          onClick={clearFilters}
          className="mt-6 w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-lg"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 py-16 pt-32 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Fitness Blog</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          Expert tips, workout guides, and nutrition advice to help you achieve your fitness goals.
        </p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto px-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles..."
              className="w-full px-6 py-4 pl-14 bg-gray-800/80 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full transition-colors font-medium"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-72">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <Sidebar />
          </div>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="text-center text-gray-400">Loading…</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No posts found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.slug}
                  id={`blog-card-${post.slug}`}
                  className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700"
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    onClick={() => {
                      try {
                        sessionStorage.setItem('blog:lastViewedSlug', post.slug);
                      } catch {}
                    }}
                    className="block group"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.header_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <div className="text-sm text-gray-400 mb-2 flex gap-3">
                        <span><Calendar size={14} /> {formatDate(post.publish_date)}</span>
                        <span><User size={14} /> {post.author}</span>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">{post.title}</h2>
                      {post.seo_description && (
                        <p className="text-gray-400 text-sm">{post.seo_description}</p>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default BlogListing;
