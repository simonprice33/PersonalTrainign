import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const CancellationPolicy = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/cancellation-policy`);
      if (response.data.success) {
        setSections(response.data.sections || []);
      }
    } catch (err) {
      console.error('Failed to fetch cancellation policy:', err);
      setError('Failed to load cancellation policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section 
        className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black"
        style={{ paddingTop: '120px' }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: 'rgba(211, 255, 98, 0.1)' }}>
              <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
              <span className="text-sm" style={{ color: 'var(--brand-primary)' }}>
                Policy Information
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cancellation Policy
            </h1>
            <p className="text-xl text-gray-300">
              Please review our cancellation terms and conditions below
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>

            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading policy...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="bg-red-50 text-red-600 p-6 rounded-xl">
                  <p>{error}</p>
                </div>
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No cancellation policy has been set up yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {sections.map((section, sectionIndex) => (
                  <div 
                    key={section.id || sectionIndex}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div 
                      className="px-6 py-4 border-b border-gray-100"
                      style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}
                    >
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ 
                            background: 'var(--brand-primary)', 
                            color: 'var(--brand-dark)' 
                          }}
                        >
                          {sectionIndex + 1}
                        </span>
                        {section.title}
                      </h2>
                    </div>
                    <div className="p-6">
                      {section.items && section.items.length > 0 ? (
                        <ul className="space-y-3">
                          {section.items.map((item, itemIndex) => (
                            <li 
                              key={item.id || itemIndex}
                              className="flex items-start gap-3 text-gray-700"
                            >
                              <ChevronRight 
                                size={18} 
                                className="flex-shrink-0 mt-0.5"
                                style={{ color: 'var(--brand-primary)' }}
                              />
                              <span>{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">No items in this section.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contact Section */}
            <div className="mt-12 p-6 bg-gray-100 rounded-xl text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Have Questions?
              </h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about our cancellation policy, please don't hesitate to get in touch.
              </p>
              <Link
                to="/#contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all hover:scale-105"
                style={{ 
                  background: 'var(--brand-primary)', 
                  color: 'var(--brand-dark)' 
                }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CancellationPolicy;
