import React, { useState } from 'react';
import { Phone, Mail, User, Clock, CheckCircle } from 'lucide-react';

const ClientContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bestTimeToCall: '',
    joinMailingList: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);

  const timeSlots = [
    { value: '9am-11am', label: '9:00 AM - 11:00 AM' },
    { value: '11am-1pm', label: '11:00 AM - 1:00 PM' },
    { value: '1pm-3pm', label: '1:00 PM - 3:00 PM' },
    { value: '3pm-5pm', label: '3:00 PM - 5:00 PM' },
    { value: '5pm-7pm', label: '5:00 PM - 7:00 PM' },
    { value: 'evening', label: 'Evening (After 7:00 PM)' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.bestTimeToCall) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/client-contact`;
      console.log('Submitting to:', url);
      console.log('Form data:', formData);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setShowThankYou(true);
      } else {
        throw new Error(data.message || 'Failed to submit form');
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Failed to submit form. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showThankYou) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-2xl w-full text-center">
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-hover) 100%)' }}
          >
            <CheckCircle size={48} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Thank You!
          </h1>
          
          <p className="text-xl mb-2" style={{ color: 'var(--text-secondary)' }}>
            Your form has been submitted successfully.
          </p>
          
          <p className="text-lg mb-8" style={{ color: 'var(--text-light)' }}>
            Simon will be in contact with you as soon as possible.
          </p>

          <div 
            className="p-6 rounded-2xl mb-8"
            style={{ background: 'var(--bg-card)', border: '2px solid var(--border-medium)' }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              What happens next?
            </h3>
            <ul className="text-left space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--brand-primary)' }}>✓</span>
                <span>Simon will review your contact request</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--brand-primary)' }}>✓</span>
                <span>You'll receive a call during your preferred time slot</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--brand-primary)' }}>✓</span>
                <span>Discuss your fitness goals and how Simon can help</span>
              </li>
            </ul>
          </div>

          <a 
            href="https://simonprice-pt.co.uk"
            className="inline-block px-8 py-3 rounded-full font-semibold transition-all"
            style={{ 
              background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-hover) 100%)',
              color: 'var(--brand-dark)'
            }}
          >
            Return to Website
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_personal-trainer-24/artifacts/g2n7e7ey_Logo%20800x770.png"
            alt="Simon Price PT"
            className="h-16 mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Get Started Today
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Fill in your details and Simon will be in touch to discuss your fitness goals
          </p>
        </div>

        {/* Form Card */}
        <div 
          className="p-8 rounded-3xl"
          style={{ background: 'var(--bg-card)', border: '2px solid var(--border-medium)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Full Name *
              </label>
              <div className="relative">
                <User 
                  size={20} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--text-light)' }}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border"
                  style={{ 
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-page)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Email Address *
              </label>
              <div className="relative">
                <Mail 
                  size={20} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--text-light)' }}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border"
                  style={{ 
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-page)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Telephone Number *
              </label>
              <div className="relative">
                <Phone 
                  size={20} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--text-light)' }}
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border"
                  style={{ 
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-page)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="+44 7XXX XXXXXX"
                />
              </div>
            </div>

            {/* Best Time to Call */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Best Time to Call *
              </label>
              <div className="relative">
                <Clock 
                  size={20} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--text-light)' }}
                />
                <select
                  name="bestTimeToCall"
                  value={formData.bestTimeToCall}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border"
                  style={{ 
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-page)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="">Select your preferred time</option>
                  {timeSlots.map(slot => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mailing List Opt-in */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="joinMailingList"
                checked={formData.joinMailingList}
                onChange={handleInputChange}
                className="mt-1"
                style={{ accentColor: 'var(--brand-primary)' }}
              />
              <label className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Yes, I'd like to receive fitness tips, exclusive offers, and updates from Simon Price PT
              </label>
            </div>

            {/* Submit Status */}
            {submitStatus && (
              <div 
                className={`p-4 rounded-xl ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-500/20 border-2 border-green-500' 
                    : 'bg-red-500/20 border-2 border-red-500'
                }`}
              >
                <p style={{ color: submitStatus.type === 'success' ? '#10b981' : '#ef4444' }}>
                  {submitStatus.message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cta w-full group"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Request
                  <Phone size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--text-light)' }}>
              By submitting this form, you agree to be contacted by Simon Price Personal Training
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientContactForm;
