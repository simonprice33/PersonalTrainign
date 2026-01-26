import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { useHomepageContent, getIconComponent } from '../context/HomepageContentContext';

const defaultContact = {
  heading: 'Start Your Transformation Today',
  description: "Ready to transform your body and life? Get in touch for a free consultation and let's create a personalized plan that gets you the results you deserve.",
  formHeading: 'Get Your Free Consultation',
  formDescription: "Fill out the form below and I'll get back to you within 24 hours with a personalized plan tailored to your goals.",
  formButtonText: 'Get My Free Consultation',
  contactHeading: 'Get In Touch',
  phone: '+44 7471 931 170',
  email: 'simon.price@simonpricept.com',
  location: 'Bognor Regis, West Sussex, UK',
  trustBadgesHeading: 'Why Choose Simon Price PT?',
  trustBadges: [
    { icon: 'Clock', title: '24-Hour Response', description: 'I respond to all inquiries within 24 hours' },
    { icon: 'Shield', title: 'Proven Results', description: 'Huge success rate with happy clients' },
    { icon: 'CheckCircle', title: 'Personalized Approach', description: 'Every plan is tailored to your unique goals' }
  ],
  specialOffer: {
    heading: 'Limited Time Offer',
    description: 'Get your first consultation absolutely FREE + receive a complimentary nutrition guide worth £50!',
    footnote: '*Valid for new clients only'
  },
  fitnessGoals: [
    { value: 'weight-loss', label: 'Weight Loss' },
    { value: 'muscle-gain', label: 'Muscle Gain' },
    { value: 'strength', label: 'Increase Strength' },
    { value: 'endurance', label: 'Improve Endurance' },
    { value: 'general', label: 'General Fitness' },
    { value: 'other', label: 'Other' }
  ],
  experienceLevels: [
    { value: 'beginner', label: 'Beginner (0-1 years)' },
    { value: 'intermediate', label: 'Intermediate (1-3 years)' },
    { value: 'advanced', label: 'Advanced (3+ years)' }
  ]
};

const Contact = () => {
  const { content } = useHomepageContent();
  const contact = content?.contact || defaultContact;

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', goals: '', experience: '', message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({ type: 'success', message: data.message });
        setFormData({ name: '', email: '', phone: '', goals: '', experience: '', message: '' });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = { border: '1px solid var(--border-medium)', background: 'var(--bg-card)', color: 'var(--text-primary)' };

  return (
    <section id="contact" className="section-padding">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="heading-1 mb-6">{contact.heading}</h2>
          <p className="body-large max-w-3xl mx-auto">{contact.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="space-y-8">
            <div>
              <h3 className="heading-2 mb-4">{contact.formHeading}</h3>
              <p className="body-medium mb-8">{contact.formDescription}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                    className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                    style={inputStyle} placeholder="Enter your full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                    className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                    style={inputStyle} placeholder="your.email@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={inputStyle} placeholder="+44 7XXX XXXXXX" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Fitness Goals *</label>
                <select name="goals" value={formData.goals} onChange={handleInputChange} required
                  className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={inputStyle}>
                  <option value="">Select your primary goal</option>
                  {(contact.fitnessGoals || defaultContact.fitnessGoals).map((goal, idx) => (
                    <option key={idx} value={goal.value}>{goal.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Current Fitness Experience</label>
                <select name="experience" value={formData.experience} onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={inputStyle}>
                  <option value="">Select your experience level</option>
                  {(contact.experienceLevels || defaultContact.experienceLevels).map((level, idx) => (
                    <option key={idx} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Additional Message</label>
                <textarea name="message" value={formData.message} onChange={handleInputChange} rows={4}
                  className="w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 resize-none"
                  style={inputStyle} placeholder="Tell me more about your goals, challenges, or any questions you have..." />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-cta w-full group">
                {isSubmitting ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Sending...</>
                ) : (
                  <>{contact.formButtonText}<Send size={20} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>

              {submitStatus && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${submitStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {submitStatus.type === 'success' ? <CheckCircle size={20} /> : <Mail size={20} />}
                  {submitStatus.message}
                </div>
              )}
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="heading-2 mb-6">{contact.contactHeading}</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-primary)' }}>
                    <Phone size={20} style={{ color: 'var(--brand-dark)' }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Phone</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{contact.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-primary)' }}>
                    <Mail size={20} style={{ color: 'var(--brand-dark)' }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Email</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{contact.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-primary)' }}>
                    <MapPin size={20} style={{ color: 'var(--brand-dark)' }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Location</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{contact.location}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="network-card p-6" style={{ background: 'var(--bg-card)' }}>
              <h4 className="heading-3 mb-4">{contact.trustBadgesHeading}</h4>
              <div className="space-y-4">
                {(contact.trustBadges || []).map((badge, index) => {
                  const IconComponent = getIconComponent(badge.icon);
                  return (
                    <div key={badge.id || index} className="flex items-center gap-3">
                      <IconComponent size={20} style={{ color: 'var(--brand-primary)' }} />
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{badge.title}</div>
                        <div className="text-xs" style={{ color: 'var(--text-light)' }}>{badge.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Special Offer */}
            <div className="p-6 rounded-3xl text-center" style={{ background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-hover) 100%)', color: 'white' }}>
              <h4 className="text-xl font-bold mb-2">{contact.specialOffer?.heading}</h4>
              <p className="mb-4">{contact.specialOffer?.description}</p>
              <p className="text-sm opacity-90">{contact.specialOffer?.footnote}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
