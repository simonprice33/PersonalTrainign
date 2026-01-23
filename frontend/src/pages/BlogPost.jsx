import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Calendar, User, Tag, ArrowLeft, Clock,
  Share2, Facebook, Twitter, Linkedin
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const MarkdownSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
    <div className="h-4 bg-gray-700 rounded w-full"></div>
    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
    <div className="h-4 bg-gray-700 rounded w-full"></div>
    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
  </div>
);

// ✅ Custom markdown components
const markdownComponents = {
  img: (props) => {
    const alt = props.alt || '';
    const [description, position] = alt.split('|');

    let containerClass = 'my-6';
    let imgClass = 'rounded-lg max-w-full h-auto';

    switch (position?.trim()) {
      case 'left':
        containerClass = 'float-left mr-6 mb-4 max-w-[50%]';
        break;
      case 'right':
        containerClass = 'float-right ml-6 mb-4 max-w-[50%]';
        break;
      case 'square':
        containerClass = 'my-6 mx-auto';
        imgClass += ' aspect-square object-cover max-w-md';
        break;
      default:
        containerClass = 'my-6';
        imgClass += ' w-full';
    }

    return (
      <figure className={containerClass}>
        <img src={props.src} alt={description} className={imgClass} />
        {description && (
          <figcaption className="text-center text-sm text-gray-400 mt-2 italic">
            {description}
          </figcaption>
        )}
      </figure>
    );
  },

  h1: (props) => <h1 className="text-3xl font-bold text-white mt-8 mb-4">{props.children}</h1>,
  h2: (props) => <h2 className="text-2xl font-bold text-white mt-8 mb-4">{props.children}</h2>,
  h3: (props) => <h3 className="text-xl font-bold text-white mt-6 mb-3">{props.children}</h3>,

  // ✅ Safe p renderer to avoid <p><figure></figure></p>
  p: ({ children }) => {
    const flat = React.Children.toArray(children);
    const containsBlock = flat.some(child =>
      React.isValidElement(child) &&
      typeof child.type === 'string' &&
      ['figure', 'table', 'div'].includes(child.type)
    );
    if (containsBlock) return <>{children}</>;
    return <p className="text-gray-300 leading-relaxed mb-4">{children}</p>;
  },

  ul: (props) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">{props.children}</ul>,
  ol: (props) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">{props.children}</ol>,
  li: (props) => <li className="text-gray-300">{props.children}</li>,
  blockquote: (props) => (
    <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 my-6 bg-gray-800/50 rounded-r-lg italic text-gray-300">
      {props.children}
    </blockquote>
  ),
  code: (props) => {
    if (props.inline) {
      return <code className="bg-gray-800 px-2 py-1 rounded text-cyan-400 text-sm">{props.children}</code>;
    }
    return <code className="block bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">{props.children}</code>;
  },
  a: (props) => <a href={props.href} className="text-cyan-400 hover:text-cyan-300 underline">{props.children}</a>,
  strong: (props) => <strong className="font-bold text-white">{props.children}</strong>,
  hr: () => <hr className="my-8 border-gray-700" />,
};

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [contentReady, setContentReady] = useState(false);
  const mountedRef = useRef(true);

  // ✅ Reset scroll to avoid layout shifts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/blog/posts/${slug}`);
      if (response.data.success) {
        setPost(response.data.post);
        document.title = response.data.post.seo_title || response.data.post.title;
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(err.response?.status === 404 ? 'Post not found' : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/blog/categories`);
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setContentReady(false);
    fetchPost();
    fetchCategories();
    return () => {
      mountedRef.current = false;
    };
  }, [slug, fetchPost, fetchCategories]);

  useEffect(() => {
    if (post && !loading && mountedRef.current) {
      const timeoutId = setTimeout(() => {
        if (mountedRef.current) setContentReady(true);
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [post, loading]);

  const handleBackClick = (e) => {
    e.preventDefault();

    // Store the originating post so the listing can scroll back to it
    try {
      sessionStorage.setItem('blog:lastViewedSlug', slug);
    } catch {
      // ignore
    }

    setContentReady(false);
    navigate('/blog');
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getReadingTime = (content) => {
    const words = content?.split(/\s+/).length || 0;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = (platform) => {
    const title = post?.title || '';
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">{error}</h1>
          <p className="text-gray-400 mb-6">The post you are looking for does not exist or has been removed.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      <div className="relative h-[50vh] min-h-[400px] max-h-[600px] mt-20">
        <img src={post.header_image} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
        <div className="absolute top-6 left-6">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto max-w-4xl">
            {post.category_slug && (
              <Link
                to={`/blog?category=${post.category_slug}`}
                className="inline-block px-4 py-1 bg-cyan-500 text-white text-sm font-medium rounded-full mb-4 hover:bg-cyan-600 transition-colors"
              >
                {categories.find(c => c.slug === post.category_slug)?.name || post.category_slug}
              </Link>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-300">
              <span className="flex items-center gap-2"><User size={18} />{post.author}</span>
              <span className="flex items-center gap-2"><Calendar size={18} />{formatDate(post.publish_date)}</span>
              <span className="flex items-center gap-2"><Clock size={18} />{getReadingTime(post.content)}</span>
            </div>
          </div>
        </div>
      </div>

      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-700">
            <span className="text-gray-400 flex items-center gap-2"><Share2 size={18} />Share:</span>
            <button onClick={() => handleShare('facebook')} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"><Facebook size={20} /></button>
            <button onClick={() => handleShare('twitter')} className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"><Twitter size={20} /></button>
            <button onClick={() => handleShare('linkedin')} className="p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg"><Linkedin size={20} /></button>
          </div>

          <div className="blog-content space-y-6">

            {contentReady && post.content ? (
              <ReactMarkdown
                key={slug}
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {post.content}
              </ReactMarkdown>
            ) : (
              <MarkdownSkeleton />
            )}
          </div>

          <div className="clear-both"></div>

          {post.tags?.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-700">
              <div className="flex items-center gap-3 flex-wrap">
                <Tag size={20} className="text-gray-400" />
                {post.tags.map((tag) => (
                  <Link key={tag} to={`/blog?tag=${tag}`} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full">#{tag}</Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-700 text-center mb-8">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
            >
              <ArrowLeft size={20} />
              Back to All Posts
            </button>
          </div>
        </div>
      </article>

      <div className="mt-8">
        <Footer />
      </div>
    </div>
  );
};

export default BlogPost;
