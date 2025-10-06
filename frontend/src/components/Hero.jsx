import React from 'react';
import { ArrowRight, Star, Users, Trophy } from 'lucide-react';

const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="section-padding" style={{ paddingTop: '120px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="display-large">
                Transform Your Body, 
                <span style={{ color: 'var(--brand-primary)' }}> Transform Your Life</span>
              </h1>
              <p className="body-large max-w-2xl">
                Get personalized training, nutrition plans, and 24/7 support from an experienced personal trainer. 
                Join hundreds of clients who've achieved their fitness goals with Simon Price Personal Training.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full" style={{ background: 'var(--brand-primary)' }}>
                  <Users size={20} style={{ color: 'var(--brand-dark)' }} />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>500+</div>
                  <div className="text-sm" style={{ color: 'var(--text-light)' }}>Happy Clients</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full" style={{ background: 'var(--brand-primary)' }}>
                  <Trophy size={20} style={{ color: 'var(--brand-dark)' }} />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>5 Years</div>
                  <div className="text-sm" style={{ color: 'var(--text-light)' }}>Experience</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full" style={{ background: 'var(--brand-primary)' }}>
                  <Star size={20} style={{ color: 'var(--brand-dark)' }} />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>4.9/5</div>
                  <div className="text-sm" style={{ color: 'var(--text-light)' }}>Client Rating</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={scrollToContact}
                className="btn-cta group"
              >
                Start Your Transformation
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary"
              >
                View Services
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white" style={{ background: 'var(--brand-primary)' }}></div>
                ))}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                Join 500+ satisfied clients who transformed their lives
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div 
                className="w-96 h-96 rounded-full flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-hover) 100%)',
                  boxShadow: '0 20px 40px rgba(0, 191, 255, 0.3)'
                }}
              >
                <div className="text-center text-white">
                  <div className="text-6xl font-bold mb-2">SP</div>
                  <div className="text-xl font-semibold">Personal Training</div>
                  <div className="text-sm opacity-90 mt-2">Your Success, My Mission</div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div 
                className="absolute -top-4 -right-4 p-3 rounded-full shadow-lg"
                style={{ background: 'white' }}
              >
                <Trophy size={24} style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div 
                className="absolute -bottom-4 -left-4 p-3 rounded-full shadow-lg"
                style={{ background: 'white' }}
              >
                <Star size={24} style={{ color: 'var(--brand-primary)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;