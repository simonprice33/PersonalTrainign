import React from 'react';
import { ArrowRight, Star, Users, Trophy } from 'lucide-react';
import { useHomepageContent, getIconComponent } from '../context/HomepageContentContext';

// Default content for fallback
const defaultHero = {
  heading: 'Transform Your Body,',
  headingHighlight: ' Transform Your Life',
  description: 'Get personalized training, nutrition plans, and dedicated support from a passionate, certified personal trainer. Start your fitness journey with someone committed to helping you achieve your goals.',
  stats: [
    { icon: 'Trophy', title: 'Certified', subtitle: 'Personal Trainer' },
    { icon: 'Users', title: 'Passionate', subtitle: 'About Fitness' },
    { icon: 'Star', title: 'Dedicated', subtitle: 'To Your Success' }
  ],
  ctaPrimary: 'Start Your Transformation',
  ctaSecondary: 'View Services',
  trustText: 'Start your transformation journey with personalized support',
  profileImage: 'https://customer-assets.emergentagent.com/job_simonfitcoach/artifacts/sbmcvjkm_IMG_0200.JPEG',
  profileCaption: 'Personal Training',
  profileSubcaption: 'Your Success, My Mission'
};

const Hero = () => {
  const { content, loading } = useHomepageContent();
  const hero = content?.hero || defaultHero;

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToServices = () => {
    const element = document.getElementById('services');
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
                {hero.heading}
                <span style={{ color: 'var(--brand-primary)' }}>{hero.headingHighlight}</span>
              </h1>
              <p className="body-large max-w-2xl">
                {hero.description}
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              {(hero.stats || []).map((stat, index) => {
                const IconComponent = getIconComponent(stat.icon);
                return (
                  <div key={stat.id || index} className="flex items-center gap-2">
                    <div className="p-2 rounded-full" style={{ background: 'var(--brand-primary)' }}>
                      <IconComponent size={20} style={{ color: 'var(--brand-dark)' }} />
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.title}</div>
                      <div className="text-sm" style={{ color: 'var(--text-light)' }}>{stat.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={scrollToContact}
                className="btn-cta group"
              >
                {hero.ctaPrimary}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={scrollToServices}
                className="btn-secondary"
              >
                {hero.ctaSecondary}
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
                {hero.trustText}
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div 
                className="w-96 h-96 rounded-full overflow-hidden flex items-center justify-center relative"
                style={{ 
                  border: '8px solid var(--brand-primary)',
                  boxShadow: '0 20px 40px rgba(0, 191, 255, 0.5), inset 0 0 0 4px rgba(0, 191, 255, 0.1)'
                }}
              >
                {hero.profileImage && (
                  <img 
                    src={hero.profileImage}
                    alt="Simon Price - Personal Trainer"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: hero.profileImagePosition || 'center 30%' }}
                    onError={(e) => {
                      console.error('Hero image failed to load:', hero.profileImage);
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div 
                  className="absolute bottom-0 left-0 right-0 text-center text-white py-4"
                  style={{ 
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 50%, transparent 100%)'
                  }}
                >
                  <div className="text-xl font-semibold">{hero.profileCaption}</div>
                  <div className="text-sm opacity-90 mt-1">{hero.profileSubcaption}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
