import React from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { useHomepageContent } from '../context/HomepageContentContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Helper to get full image URL
const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
  return url;
};

// Default about content
const defaultAbout = {
  heading: 'Meet Simon Price',
  subheading: 'Your Partner in Transformation',
  paragraph1: 'As a certified personal trainer with a passion for fitness and helping others, I believe that everyone deserves to feel confident, strong, and healthy in their own body.',
  paragraph2: "My approach goes beyond just exercise and nutrition. I focus on building sustainable habits, providing unwavering support, and creating personalized strategies that fit your lifestyle. Your success is my mission, and I'm here to guide you every step of the way.",
  values: [
    { value: 'Fresh Start', subtitle: 'New Perspective' },
    { value: 'Certified', subtitle: 'Professional Training' },
    { value: 'Dedicated', subtitle: 'To Your Goals' },
    { value: 'Passionate', subtitle: 'About Fitness' }
  ],
  qualificationsHeading: 'Qualifications & Commitment',
  qualifications: [
    { text: 'Certified Personal Trainer' },
    { text: 'Nutrition Guidance Qualified' },
    { text: 'Committed to Continued Learning' },
    { text: 'Focused on Client Success' }
  ],
  profileName: 'Simon Price',
  profileTitle: 'Certified Personal Trainer',
  profileImage: 'https://customer-assets.emergentagent.com/job_simonfitcoach/artifacts/sbmcvjkm_IMG_0200.JPEG',
  profileStats: [
    { label: 'Commitment Level', value: '100%' },
    { label: 'Passion for Fitness', value: 'MAX' },
    { label: 'Dedication to You', value: 'Always' }
  ],
  profileQuote: '"Ready to help you achieve your fitness goals"'
};

const About = () => {
  const { content } = useHomepageContent();
  const about = content?.about || defaultAbout;

  return (
    <section id="about" className="section-padding">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="heading-1">{about.heading}</h2>
              <h3 className="heading-3" style={{ color: 'var(--brand-primary)' }}>
                {about.subheading}
              </h3>
              <p className="body-large">{about.paragraph1}</p>
              <p className="body-medium">{about.paragraph2}</p>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-2 gap-6">
              {(about.values || []).map((item, index) => (
                <div key={item.id || index} className="text-center p-4">
                  <div className="text-2xl font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>
                    {item.value}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                    {item.subtitle}
                  </div>
                </div>
              ))}
            </div>

            {/* Qualifications */}
            <div className="space-y-4">
              <h4 className="heading-3">{about.qualificationsHeading}</h4>
              <div className="space-y-3">
                {(about.qualifications || []).map((qual, index) => (
                  <div key={qual.id || index} className="flex items-center gap-3">
                    <CheckCircle size={20} style={{ color: 'var(--brand-primary)' }} />
                    <span className="body-medium">{qual.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="network-card p-8 max-w-md" style={{ background: 'var(--bg-card)' }}>
                <div className="text-center mb-6">
                  <div 
                    className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden"
                    style={{ border: '3px solid var(--brand-primary)', boxShadow: '0 4px 12px rgba(0, 191, 255, 0.3)' }}
                  >
                    <img src={getImageUrl(about.profileImage)} alt={about.profileName} className="w-full h-full object-cover" style={{ objectPosition: about.profileImagePosition || 'center' }} />
                  </div>
                  <h3 className="heading-3 mb-2">{about.profileName}</h3>
                  <p className="body-medium" style={{ color: 'var(--text-secondary)' }}>{about.profileTitle}</p>
                </div>

                <div className="space-y-4">
                  {(about.profileStats || []).map((stat, index) => (
                    <React.Fragment key={stat.id || index}>
                      <div className="flex items-center justify-between">
                        <span className="body-medium">{stat.label}</span>
                        <span className="font-semibold" style={{ color: 'var(--brand-primary)' }}>{stat.value}</span>
                      </div>
                      {index === 0 && (
                        <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-subtle)' }}>
                          <div className="h-2 rounded-full" style={{ background: 'var(--brand-primary)', width: '100%' }}></div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} fill="var(--brand-primary)" style={{ color: 'var(--brand-primary)' }} />
                    ))}
                  </div>
                  <p className="text-center text-sm" style={{ color: 'var(--text-light)' }}>{about.profileQuote}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
