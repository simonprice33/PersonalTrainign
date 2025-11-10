import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error, invalid
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    
    if (!emailParam) {
      setStatus('invalid');
      setMessage('No email address provided in the unsubscribe link.');
      return;
    }

    setEmail(emailParam);
    handleUnsubscribe(emailParam);
  }, [searchParams]);

  const handleUnsubscribe = async (emailAddress) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/unsubscribe`, {
        email: emailAddress
      });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'An error occurred. Please try again or contact support.');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
    >
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_personal-trainer-24/artifacts/g2n7e7ey_Logo%20800x770.png" 
            alt="Simon Price PT" 
            className="h-20 w-auto mx-auto mb-4"
          />
        </div>

        {/* Card */}
        <div 
          className="rounded-2xl p-8 md:p-12 shadow-2xl border"
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(211, 255, 98, 0.2)'
          }}
        >
          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-6"
                style={{ borderColor: '#d3ff62' }}
              ></div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Processing Your Request
              </h2>
              <p className="text-gray-400">
                Please wait while we unsubscribe you from our mailing list...
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(16, 185, 129, 0.2)' }}
              >
                <CheckCircle size={48} className="text-green-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                Successfully Unsubscribed
              </h2>
              
              <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <Mail size={20} className="text-gray-400 inline mr-2" />
                <span className="text-white font-medium">{email}</span>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                {message}
              </p>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-blue-300 text-sm">
                  You will no longer receive marketing emails from Simon Price PT. 
                  You may still receive important transactional emails if you have an active account.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Changed your mind? You can resubscribe anytime by visiting our website.
                </p>
                
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-all duration-200 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #d3ff62 0%, #a8d946 100%)', color: '#1a1a2e' }}
                >
                  <ArrowLeft size={20} />
                  Return to Homepage
                </Link>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239, 68, 68, 0.2)' }}
              >
                <XCircle size={48} className="text-red-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                Unsubscribe Failed
              </h2>
              
              <p className="text-gray-300 mb-6">
                {message}
              </p>

              {email && (
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <Mail size={20} className="text-gray-400 inline mr-2" />
                  <span className="text-white font-medium">{email}</span>
                </div>
              )}
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-300 text-sm">
                  If you continue to have issues, please contact us directly at{' '}
                  <a href="mailto:simon@simonpricept.com" className="underline">
                    simon@simonpricept.com
                  </a>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handleUnsubscribe(email)}
                  className="px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
                >
                  Try Again
                </button>
                
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-gray-300 border border-gray-600 hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft size={20} />
                  Return to Homepage
                </Link>
              </div>
            </div>
          )}

          {/* Invalid State */}
          {status === 'invalid' && (
            <div className="text-center">
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239, 68, 68, 0.2)' }}
              >
                <XCircle size={48} className="text-red-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                Invalid Unsubscribe Link
              </h2>
              
              <p className="text-gray-300 mb-6">
                {message}
              </p>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-300 text-sm">
                  Please use the unsubscribe link from the email you received, or contact us at{' '}
                  <a href="mailto:simon@simonpricept.com" className="underline">
                    simon@simonpricept.com
                  </a>
                </p>
              </div>

              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-all duration-200 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #d3ff62 0%, #a8d946 100%)', color: '#1a1a2e' }}
              >
                <ArrowLeft size={20} />
                Return to Homepage
              </Link>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2024 Simon Price Personal Training. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Unsubscribe;
