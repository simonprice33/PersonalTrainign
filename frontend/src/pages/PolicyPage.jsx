import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, Cookie, Scale } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Policy type configurations
const POLICY_CONFIG = {
  'cancellation-policy': {
    title: 'Cancellation Policy',
    subtitle: 'Subscription cancellation terms and conditions',
    icon: Scale,
    endpoint: '/api/cancellation-policy',
    color: 'from-amber-500 to-orange-600',
    accentColor: 'amber'
  },
  'terms-of-service': {
    title: 'Terms of Service',
    subtitle: 'Terms and conditions for using our services',
    icon: FileText,
    endpoint: '/api/terms-of-service',
    color: 'from-blue-500 to-indigo-600',
    accentColor: 'blue'
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your data',
    icon: Shield,
    endpoint: '/api/privacy-policy',
    color: 'from-emerald-500 to-teal-600',
    accentColor: 'emerald'
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    subtitle: 'Information about how we use cookies',
    icon: Cookie,
    endpoint: '/api/cookie-policy',
    color: 'from-purple-500 to-violet-600',
    accentColor: 'purple'
  }
};

const PolicyPage = () => {
  const { policyType: paramPolicyType } = useParams();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Handle both /policies/:policyType and legacy /cancellation-policy routes
  const policyType = paramPolicyType || 'cancellation-policy';
  const config = POLICY_CONFIG[policyType] || POLICY_CONFIG['cancellation-policy'];
  const IconComponent = config.icon;

  useEffect(() => {
    // Scroll to top when policy type changes
    window.scrollTo(0, 0);
    fetchPolicy();
  }, [policyType]);

  const fetchPolicy = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BACKEND_URL}${config.endpoint}`);
      if (response.data.success) {
        setSections(response.data.sections || []);
      }
    } catch (err) {
      console.error('Failed to fetch policy:', err);
      setError('Failed to load policy content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-dark)' }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Background gradient */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-10`}
        />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Icon badge */}
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, rgba(211, 255, 98, 0.2) 0%, rgba(211, 255, 98, 0.1) 100%)',
                border: '1px solid rgba(211, 255, 98, 0.3)'
              }}
            >
              <IconComponent size={36} style={{ color: 'var(--brand-primary)' }} />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {config.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              {config.subtitle}
            </p>
            
            {/* Last updated */}
            <p className="text-sm text-gray-500 mt-6">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>

            {loading ? (
              <div className="text-center py-20">
                <div 
                  className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                  style={{ 
                    border: '3px solid rgba(211, 255, 98, 0.2)',
                    borderTopColor: 'var(--brand-primary)'
                  }}
                />
                <p className="text-gray-400">Loading policy content...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div 
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                  style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <FileText size={32} className="text-red-400" />
                </div>
                <p className="text-red-400 mb-4">{error}</p>
                <button 
                  onClick={fetchPolicy}
                  className="px-6 py-2 rounded-lg text-white transition-colors"
                  style={{ background: 'var(--brand-primary)', color: 'var(--brand-dark)' }}
                >
                  Try Again
                </button>
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-20">
                <div 
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <IconComponent size={40} className="text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Content Coming Soon
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  We are currently updating our {config.title.toLowerCase()}. 
                  Please check back soon or contact us for more information.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((section, sectionIndex) => (
                  <div 
                    key={section.id || sectionIndex}
                    className="rounded-2xl overflow-hidden"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {/* Section Header */}
                    <div 
                      className="px-6 py-5 flex items-center gap-4"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <span 
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                        style={{ 
                          background: 'var(--brand-primary)', 
                          color: 'var(--brand-dark)' 
                        }}
                      >
                        {sectionIndex + 1}
                      </span>
                      <h2 className="text-xl font-semibold text-white">
                        {section.title}
                      </h2>
                    </div>
                    
                    {/* Section Content */}
                    <div className="p-6">
                      {section.content ? (
                        <div className="prose prose-invert prose-sm max-w-none
                          prose-headings:text-white prose-headings:font-semibold
                          prose-p:text-gray-300 prose-p:leading-relaxed
                          prose-li:text-gray-300 prose-li:marker:text-[var(--brand-primary)]
                          prose-strong:text-white prose-strong:font-semibold
                          prose-a:text-[var(--brand-primary)] prose-a:no-underline hover:prose-a:underline
                          prose-ul:space-y-2 prose-ol:space-y-2
                        ">
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      ) : section.items && section.items.length > 0 ? (
                        <div className="space-y-4">
                          {section.items.map((item, itemIndex) => (
                            <div 
                              key={item.id || itemIndex}
                              className="text-gray-300 leading-relaxed policy-content
                                [&_p]:my-1
                                [&_strong]:text-white [&_strong]:font-semibold
                                [&_em]:text-gray-200
                                [&_ul]:my-2 [&_ul]:ml-5 [&_ul]:space-y-1
                                [&_ol]:my-2 [&_ol]:ml-5 [&_ol]:space-y-1
                                [&_li]:text-gray-300 [&_li]:pl-1
                                [&>ul>li]:list-disc [&>ul>li::marker]:text-[var(--brand-primary)]
                                [&_ul_ul>li]:list-[circle] [&_ul_ul>li::marker]:text-gray-400
                                [&_ul_ul_ul>li]:list-[square] [&_ul_ul_ul>li::marker]:text-gray-500
                              "
                            >
                              <ReactMarkdown>{item.text}</ReactMarkdown>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">
                          No details available for this section.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contact Section */}
            <div 
              className="mt-12 p-8 rounded-2xl text-center"
              style={{ 
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <h3 className="text-xl font-semibold text-white mb-2">
                Have Questions?
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                If you have any questions about this policy, please do not hesitate to contact us.
              </p>
              <Link
                to="/#contact"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 hover:shadow-lg"
                style={{ 
                  background: 'var(--brand-primary)', 
                  color: 'var(--brand-dark)',
                  boxShadow: '0 0 20px rgba(211, 255, 98, 0.3)'
                }}
              >
                Contact Us
              </Link>
            </div>

            {/* Related Policies */}
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-white mb-4">
                Related Policies
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(POLICY_CONFIG)
                  .filter(([key]) => key !== policyType)
                  .slice(0, 3)
                  .map(([key, policy]) => {
                    const PolicyIcon = policy.icon;
                    return (
                      <Link
                        key={key}
                        to={`/policies/${key}`}
                        className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <PolicyIcon size={20} className="text-gray-400" />
                        <span className="text-gray-300 text-sm font-medium">
                          {policy.title}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PolicyPage;
