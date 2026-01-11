import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, Shield } from 'lucide-react';
// import ReCAPTCHA from 'react-google-recaptcha'; // COMMENTED OUT - Revisit later
import { contactInfo } from '../mock/mockData';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goals: '',
    experience: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  // const [recaptchaToken, setRecaptchaToken] = useState(null); // COMMENTED OUT - Revisit later
  // const recaptchaRef = useRef(null);

  // reCAPTCHA handlers - COMMENTED OUT - Revisit later
  // const handleRecaptchaChange = (token) => {
  //   setRecaptchaToken(token);
  //   console.log('✅ reCAPTCHA token received:', token ? 'SUCCESS' : 'EXPIRED');
  // };

  // const handleRecaptchaExpired = () => {
  //   setRecaptchaToken(null);
  //   console.log('⚠️ reCAPTCHA expired');
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // COMMENTED OUT - reCAPTCHA validation - Revisit later
      // if (!recaptchaToken) {
      //   setSubmitStatus({
      //     type: 'error',
      //     message: 'Please complete the reCAPTCHA verification.'
      //   });
      //   setIsSubmitting(false);
      //   return;
      // }

      // console.log('✅ reCAPTCHA v2 token available:', recaptchaToken ? 'SUCCESS' : 'FAILED');
      // Send to backend using environment variable
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData
          // recaptchaToken: recaptchaToken // COMMENTED OUT - Revisit later
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({
          type: 'success',
          message: data.message
        });
        
        setFormData({
          name: '',
          email: '',
          phone: '',
          goals: '',
          experience: '',
          message: ''
        });
        
        // COMMENTED OUT - Reset reCAPTCHA - Revisit later
        // setRecaptchaToken(null);
        // if (recaptchaRef.current) {
        //   recaptchaRef.current.reset();
        // }
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
      
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Something went wrong. Please try again or email directly at simon.price.33@hotmail.com'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section-padding">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="heading-1 mb-6">Start Your Transformation Today</h2>
          <p className="body-large max-w-3xl mx-auto">
            Ready to transform your body and life? Get in touch for a free consultation and 
            let's create a personalized plan that gets you the results you deserve.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="space-y-8">
            <div>
              <h3 className="heading-2 mb-4">Get Your Free Consultation</h3>
              <p className="body-medium mb-8">
                Fill out the form below and I'll get back to you within 24 hours with a 
                personalized plan tailored to your goals.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                    style={{ 
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      focusRingColor: 'var(--brand-primary)'
                    }}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                    style={{ 
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)'
                  }}
                  placeholder="+44 7XXX XXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Fitness Goals *
                </label>
                <select
                  name="goals"
                  value={formData.goals}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)'
                  }}
                >
                  <option value="">Select your primary goal</option>
                  <option value="weight-loss">Weight Loss</option>
                  <option value="muscle-gain">Muscle Gain</option>
                  <option value="strength">Increase Strength</option>
                  <option value="endurance">Improve Endurance</option>
                  <option value="general">General Fitness</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Current Fitness Experience
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)'
                  }}
                >
                  <option value="">Select your experience level</option>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="advanced">Advanced (3+ years)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Additional Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 resize-none"
                  style={{ 
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)'
                  }}
                  placeholder="Tell me more about your goals, challenges, or any questions you have..."
                />
              </div>

              {/* COMMENTED OUT - reCAPTCHA v2 Component - Revisit later */}
              {/* <div className="flex justify-center mb-6">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                  onChange={handleRecaptchaChange}
                  onExpired={handleRecaptchaExpired}
                  theme="dark"
                />
              </div> */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-cta w-full group"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Get My Free Consultation
                    <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {submitStatus && (
                <div 
                  className={`p-4 rounded-2xl flex items-center gap-3 ${
                    submitStatus.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {submitStatus.type === 'success' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Mail size={20} />
                  )}
                  {submitStatus.message}
                </div>
              )}
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="heading-2 mb-6">Get In Touch</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--brand-primary)' }}
                  >
                    <Phone size={20} style={{ color: 'var(--brand-dark)' }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Phone
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {contactInfo.phone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--brand-primary)' }}
                  >
                    <Mail size={20} style={{ color: 'var(--brand-dark)' }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Email
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {contactInfo.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--brand-primary)' }}
                  >
                    <MapPin size={20} style={{ color: 'var(--brand-dark)' }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Location
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {contactInfo.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div 
              className="network-card p-6"
              style={{ background: 'var(--bg-card)' }}
            >
              <h4 className="heading-3 mb-4">Why Choose Simon Price PT?</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock size={20} style={{ color: 'var(--brand-primary)' }} />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      24-Hour Response
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                      I respond to all inquiries within 24 hours
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield size={20} style={{ color: 'var(--brand-primary)' }} />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      Proven Results
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                      Huge success rate with happy clients
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} style={{ color: 'var(--brand-primary)' }} />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      Personalized Approach
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                      Every plan is tailored to your unique goals
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Offer */}
            <div 
              className="p-6 rounded-3xl text-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-hover) 100%)',
                color: 'white'
              }}
            >
              <h4 className="text-xl font-bold mb-2">Limited Time Offer</h4>
              <p className="mb-4">Get your first consultation absolutely FREE + receive a complimentary nutrition guide worth £50!</p>
              <p className="text-sm opacity-90">*Valid for new clients only</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;