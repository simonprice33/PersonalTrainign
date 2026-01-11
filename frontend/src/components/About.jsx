import React from 'react';
import { Award, Users, Target, Star, CheckCircle } from 'lucide-react';

const About = () => {
  return (
    <section id="about" className="section-padding">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="heading-1">Meet Simon Price</h2>
              <h3 className="heading-3" style={{ color: 'var(--brand-primary)' }}>
                Your Partner in Transformation
              </h3>
              <p className="body-large">
                As a certified personal trainer with a passion for fitness and helping others, 
                I believe that everyone deserves to feel confident, strong, and healthy in their own body.
              </p>
              <p className="body-medium">
                My approach goes beyond just exercise and nutrition. I focus on building sustainable habits, 
                providing unwavering support, and creating personalized strategies that fit your lifestyle. 
                Your success is my mission, and I'm here to guide you every step of the way.
              </p>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4">
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>
                  Fresh Start
                </div>
                <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                  New Perspective
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>
                  Certified
                </div>
                <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                  Professional Training
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>
                  Dedicated
                </div>
                <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                  To Your Goals
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>
                  Passionate
                </div>
                <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                  About Fitness
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-4">
              <h4 className="heading-3">Qualifications & Commitment</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} style={{ color: 'var(--brand-primary)' }} />
                  <span className="body-medium">Certified Personal Trainer</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} style={{ color: 'var(--brand-primary)' }} />
                  <span className="body-medium">Nutrition Guidance Qualified</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} style={{ color: 'var(--brand-primary)' }} />
                  <span className="body-medium">Committed to Continued Learning</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} style={{ color: 'var(--brand-primary)' }} />
                  <span className="body-medium">Focused on Client Success</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Main Card */}
              <div 
                className="network-card p-8 max-w-md"
                style={{ background: 'var(--bg-card)' }}
              >
                <div className="text-center mb-6">
                  <div 
                    className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden"
                    style={{ 
                      border: '3px solid var(--brand-primary)',
                      boxShadow: '0 4px 12px rgba(0, 191, 255, 0.3)'
                    }}
                  >
                    <img 
                      src="https://customer-assets.emergentagent.com/job_simonfitcoach/artifacts/sbmcvjkm_IMG_0200.JPEG"
                      alt="Simon Price"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: 'center' }}
                    />
                  </div>
                  <h3 className="heading-3 mb-2">Simon Price</h3>
                  <p className="body-medium" style={{ color: 'var(--text-secondary)' }}>
                    Certified Personal Trainer
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="body-medium">Commitment Level</span>
                    <span className="font-semibold" style={{ color: 'var(--brand-primary)' }}>100%</span>
                  </div>
                  <div 
                    className="w-full h-2 rounded-full"
                    style={{ background: 'var(--bg-subtle)' }}
                  >
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        background: 'var(--brand-primary)', 
                        width: '100%' 
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="body-medium">Passion for Fitness</span>
                    <span className="font-semibold" style={{ color: 'var(--brand-primary)' }}>MAX</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="body-medium">Dedication to You</span>
                    <span className="font-semibold" style={{ color: 'var(--brand-primary)' }}>Always</span>
                  </div>
                </div>

                <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={16} 
                        fill="var(--brand-primary)" 
                        style={{ color: 'var(--brand-primary)' }}
                      />
                    ))}
                  </div>
                  <p className="text-center text-sm" style={{ color: 'var(--text-light)' }}>
                    "Ready to help you achieve your fitness goals"
                  </p>
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