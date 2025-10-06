import React from 'react';
import { 
  Dumbbell, 
  Apple, 
  MessageCircle, 
  Calendar, 
  Video, 
  Target, 
  Zap, 
  TrendingUp, 
  Smartphone 
} from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: <Dumbbell size={32} />,
      title: "Exercise Plans",
      description: "Personalized workout routines tailored to your fitness level, goals, and available equipment.",
      features: ["Custom workout design", "Progressive overload", "Form guidance"]
    },
    {
      icon: <Apple size={32} />,
      title: "Nutrition Plans", 
      description: "Science-based meal plans that complement your training and accelerate your results.",
      features: ["Macro calculation", "Meal prep guidance", "Supplement advice"]
    },
    {
      icon: <MessageCircle size={32} />,
      title: "Coach in Your Pocket",
      description: "24/7 access to me for any questions, concerns, or motivation you need along your journey.",
      features: ["Instant messaging", "Quick responses", "Always available"]
    },
    {
      icon: <Calendar size={32} />,
      title: "Weekly Reviews & Check-Ins",
      description: "Regular progress assessments and plan adjustments to keep you on track toward your goals.",
      features: ["Progress tracking", "Plan modifications", "Goal reassessment"]
    },
    {
      icon: <Video size={32} />,
      title: "Video Reviews",
      description: "Submit exercise videos for form correction and technique improvement feedback.",
      features: ["Form analysis", "Technique tips", "Injury prevention"]
    },
    {
      icon: <Target size={32} />,
      title: "Help with Discipline",
      description: "Accountability systems and strategies to build lasting fitness habits and consistency.",
      features: ["Habit formation", "Accountability", "Consistency building"]
    },
    {
      icon: <Zap size={32} />,
      title: "Help with Motivation",
      description: "Personalized motivation strategies to keep you energized and committed to your goals.",
      features: ["Motivational support", "Mindset coaching", "Goal visualization"]
    },
    {
      icon: <TrendingUp size={32} />,
      title: "Goal Setting & Progress Tracking",
      description: "Strategic goal planning with detailed tracking systems to monitor your transformation.",
      features: ["SMART goals", "Progress metrics", "Milestone celebrations"]
    },
    {
      icon: <Smartphone size={32} />,
      title: "Full Access to My App",
      description: "Complete access to my exclusive training app with workouts, nutrition, and progress tools.",
      features: ["Exercise library", "Meal tracking", "Progress photos"]
    }
  ];

  return (
    <section id="services" className="section-padding" style={{ background: 'var(--bg-subtle)' }}>
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="heading-1 mb-6">Complete Fitness Transformation</h2>
          <p className="body-large max-w-3xl mx-auto">
            Everything you need to achieve your fitness goals in one comprehensive package. 
            No guesswork, no confusion - just proven systems that deliver real results.
          </p>
        </div>

        <div className="network-grid">
          {services.map((service, index) => (
            <div 
              key={index}
              className="network-card hover-lift group"
            >
              <div className="mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300"
                  style={{ 
                    background: 'var(--brand-primary)',
                    color: 'var(--brand-dark)'
                  }}
                >
                  {service.icon}
                </div>
                <h3 className="heading-3 mb-3">{service.title}</h3>
                <p className="body-medium mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li 
                      key={idx}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--brand-primary)' }}
                      ></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div 
            className="inline-block p-8 rounded-3xl"
            style={{ background: 'var(--bg-card)' }}
          >
            <h3 className="heading-2 mb-4">Ready to Start Your Transformation?</h3>
            <p className="body-medium mb-6 max-w-2xl">
              Get access to all these services in one comprehensive package designed to guarantee your success.
            </p>
            <button 
              onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
              className="btn-cta"
            >
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;