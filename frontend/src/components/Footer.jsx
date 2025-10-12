import React, { useState } from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, Send } from 'lucide-react';
import { contactInfo, subscribeNewsletter } from '../mock/mockData';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState(null);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setIsSubscribing(true);
    setSubscribeStatus(null);

    try {
      const response = await subscribeNewsletter(email);
      setSubscribeStatus({
        type: 'success',
        message: response.message
      });
      setEmail('');
    } catch (error) {
      setSubscribeStatus({
        type: 'error',
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="section-padding" style={{ background: 'var(--brand-dark)', color: 'white' }}>
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_personal-trainer-24/artifacts/g2n7e7ey_Logo%20800x770.png" 
                alt="Simon Price Personal Training" 
                className="h-16 w-auto"
              />
            </div>
            <p className="text-gray-300 max-w-md">
              Transform your body and life with personalized training, nutrition plans, and 24/7 support. 
              Your success is my mission.
            </p>
            
            {/* Newsletter Signup */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Get Free Fitness Tips</h4>
              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 py-2 rounded-full border-none focus:outline-none focus:ring-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      focusRingColor: 'var(--brand-primary)'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubscribing}
                    className="px-4 py-2 rounded-full transition-all duration-200 hover:scale-105"
                    style={{ background: 'var(--brand-primary)', color: 'var(--brand-dark)' }}
                  >
                    {isSubscribing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
                {subscribeStatus && (
                  <p className={`text-sm ${
                    subscribeStatus.type === 'success' 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {subscribeStatus.message}
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <div className="space-y-3">
              <button 
                onClick={() => scrollToSection('home')}
                className="block text-gray-300 hover:text-white transition-colors duration-200"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="block text-gray-300 hover:text-white transition-colors duration-200"
              >
                Services
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="block text-gray-300 hover:text-white transition-colors duration-200"
              >
                About Simon
              </button>
              {/* Success Stories removed - will be added when we have real client testimonials */}
              <button 
                onClick={() => scrollToSection('contact')}
                className="block text-gray-300 hover:text-white transition-colors duration-200"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone size={18} style={{ color: 'var(--brand-primary)' }} />
                <span className="text-gray-300">{contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} style={{ color: 'var(--brand-primary)' }} />
                <span className="text-gray-300">{contactInfo.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} style={{ color: 'var(--brand-primary)' }} />
                <span className="text-gray-300">{contactInfo.location}</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h5 className="font-semibold">Follow Me</h5>
              <div className="flex gap-4">
                <a 
                  href="https://www.instagram.com/simonprice.fatlosscoach/" 
                  className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <Instagram size={20} />
                </a>
                <a 
                  href="https://www.facebook.com/simon.price.92" 
                  className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <Facebook size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div 
          className="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-gray-400 text-sm">
            © 2024 Simon Price Personal Training. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-8">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(211, 255, 98, 0.1)' }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--brand-primary)' }}
            ></div>
            <span className="text-sm" style={{ color: 'var(--brand-primary)' }}>
              Certified Personal Trainer • Passionate About Fitness • Dedicated Support
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;