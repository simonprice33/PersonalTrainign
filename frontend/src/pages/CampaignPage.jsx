import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Footer from '../components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Helper to get full media URL
const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
  return url;
};

// Simple header for campaign pages (logo only, no navigation)
const CampaignHeader = () => {
  return (
    <header className="fixed top-0 w-full z-50" style={{ background: 'rgba(10, 10, 10, 0.98)' }}>
      <div className="container mx-auto px-4">
        <div style={{
          background: 'var(--brand-dark, #1a1a1a)',
          borderRadius: '25px',
          padding: '8px 24px',
          margin: '16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(0, 255, 255, 0.1)'
        }}>
          <Link to="/" className="flex items-center gap-2">
            <span style={{
              background: 'linear-gradient(135deg, var(--neon-cyan, #00ffff) 0%, var(--neon-magenta, #ff00ff) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              SIMON PRICE
            </span>
            <span style={{
              color: 'white',
              fontWeight: 300,
              fontSize: '1.5rem',
              opacity: 0.9
            }}>
              PT
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

const CampaignPage = () => {
  const { slug } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [afterSubmitData, setAfterSubmitData] = useState(null);

  useEffect(() => {
    fetchCampaign();
  }, [slug]);

  const fetchCampaign = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/campaigns/${slug}`);
      if (response.data.success) {
        setCampaign(response.data.campaign);
      } else {
        setError('Campaign not found');
      }
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
      setError('Campaign not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/campaigns/${slug}/subscribe`, formData);
      if (response.data.success) {
        setSubmitted(true);
        setAfterSubmitData(response.data.afterSubmit);
        
        // Handle redirect if configured
        if (response.data.afterSubmit?.type === 'redirect' && response.data.afterSubmit?.redirectUrl) {
          setTimeout(() => {
            window.location.href = response.data.afterSubmit.redirectUrl;
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Failed to submit:', err);
      setSubmitError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <CampaignHeader />
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <CampaignHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Campaign Not Found</h1>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <CampaignHeader />
      
      <div className="container mx-auto px-4 pt-28 pb-12 max-w-4xl">
        {/* Campaign Header */}
        {campaign.header && (
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-6">
            {campaign.header}
          </h1>
        )}

        {/* Description */}
        {campaign.description && (
          <p className="text-lg text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            {campaign.description}
          </p>
        )}

        {/* Media Gallery */}
        {campaign.media && campaign.media.length > 0 && (
          <div className="mb-10">
            <div className={`grid gap-4 ${campaign.media.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {campaign.media.map((item, index) => (
                <div 
                  key={item.id || index} 
                  className={`rounded-xl overflow-hidden ${campaign.media.length === 1 ? 'max-w-2xl mx-auto' : ''}`}
                >
                  {item.type === 'video' ? (
                    <video
                      src={getMediaUrl(item.url)}
                      controls
                      className="w-full h-auto rounded-xl"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={getMediaUrl(item.url)}
                      alt={`Campaign media ${index + 1}`}
                      className="w-full h-auto rounded-xl"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign Up Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 max-w-md mx-auto">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {afterSubmitData?.type === 'redirect' ? 'Redirecting...' : 'Thank You!'}
              </h2>
              <p className="text-gray-300">
                {afterSubmitData?.message || 'You have been successfully signed up.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Enter your email"
                />
              </div>

              {submitError && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  campaign.submitButtonText || 'Sign Up'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
      
      {/* Standard Footer */}
      <Footer />
    </div>
  );
};

export default CampaignPage;
