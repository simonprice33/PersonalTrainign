import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, ArrowRight, Calendar, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const CALENDLY_URL = 'https://calendly.com/simon-price-simonprice-pt/30min';

const JoinNow = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendly, setShowCalendly] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    // Load Calendly widget script
    if (showCalendly && !document.querySelector('script[src*="calendly"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [showCalendly]);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/public/packages`);
      if (response.data.success) {
        setPackages(response.data.packages);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = (pkg) => {
    setSelectedPackage(pkg);
    navigate(`/purchase?package=${pkg.id}`);
  };

  const handleBookCall = () => {
    setShowCalendly(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/20 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Simon Price PT" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Simon Price PT
            </span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Transform Your Fitness Journey
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Choose the perfect coaching package to achieve your health and fitness goals
        </p>
      </section>

      {/* Packages */}
      <section className="container mx-auto px-4 py-12 pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-gray-800 rounded-2xl border border-cyan-500/30 p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
            >
              <h3 className="text-3xl font-bold mb-4 text-cyan-400">{pkg.name}</h3>
              <div className="text-5xl font-bold mb-6">
                £{pkg.price}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-gray-300 mb-6">{pkg.description}</p>
              
              <div className="space-y-3 mb-8">
                {pkg.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="text-cyan-400 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleBuyNow(pkg)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all"
                >
                  Buy Now
                  <ArrowRight size={20} />
                </button>
                
                <button
                  onClick={handleBookCall}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
                >
                  <Calendar size={20} />
                  Book a Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Calendly Modal */}
      {showCalendly && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-cyan-500/30 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Book Your Consultation</h3>
              <button
                onClick={() => setShowCalendly(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div 
              className="calendly-inline-widget" 
              data-url={CALENDLY_URL}
              style={{ minWidth: '320px', height: '700px' }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center text-gray-400 border-t border-gray-800">
        <p>&copy; 2025 Simon Price PT. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default JoinNow;
