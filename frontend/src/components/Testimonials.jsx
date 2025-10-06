import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { testimonials } from '../mock/mockData';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index) => {
    setCurrentIndex(index);
  };

  return (
    <section id="testimonials" className="section-padding" style={{ background: 'var(--bg-section)' }}>
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="heading-1 mb-6">Client Success Stories</h2>
          <p className="body-large max-w-3xl mx-auto">
            Real transformations from real people. See how Simon's comprehensive approach 
            has helped hundreds of clients achieve their fitness goals and transform their lives.
          </p>
        </div>

        {/* Featured Testimonial */}
        <div className="max-w-4xl mx-auto mb-12">
          <div 
            className="network-card p-8 md:p-12 text-center relative"
            style={{ background: 'var(--bg-card)' }}
          >
            <div 
              className="absolute top-6 left-8 opacity-20"
              style={{ color: 'var(--brand-primary)' }}
            >
              <Quote size={48} />
            </div>
            
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={20} 
                    fill="var(--brand-primary)" 
                    style={{ color: 'var(--brand-primary)' }}
                  />
                ))}
              </div>
              <p className="body-large mb-6 italic">
                "{testimonials[currentIndex].comment}"
              </p>
              <div 
                className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                style={{ 
                  background: 'var(--brand-primary)', 
                  color: 'var(--brand-dark)' 
                }}
              >
                {testimonials[currentIndex].transformation}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ background: 'var(--brand-dark)' }}
              >
                {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-left">
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {testimonials[currentIndex].name}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                  Age {testimonials[currentIndex].age} • {testimonials[currentIndex].location}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button 
                onClick={prevTestimonial}
                className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                style={{ background: 'var(--brand-primary)', color: 'var(--brand-dark)' }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentIndex 
                        ? 'scale-125' 
                        : 'opacity-50 hover:opacity-75'
                    }`}
                    style={{ background: 'var(--brand-primary)' }}
                  />
                ))}
              </div>
              
              <button 
                onClick={nextTestimonial}
                className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                style={{ background: 'var(--brand-primary)', color: 'var(--brand-dark)' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Testimonial Grid */}
        <div className="network-grid">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className="network-card p-6 hover-lift"
            >
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={16} 
                    fill="var(--brand-primary)" 
                    style={{ color: 'var(--brand-primary)' }}
                  />
                ))}
              </div>
              <p className="body-medium mb-4 italic">
                "{testimonial.comment}"
              </p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ background: 'var(--brand-dark)' }}
                >
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {testimonial.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                    {testimonial.transformation}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-12">
          <div 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
            style={{ background: 'var(--bg-card)' }}
          >
            <Star size={20} fill="var(--brand-primary)" style={{ color: 'var(--brand-primary)' }} />
            <span className="font-semibold">4.9/5 Average Rating from 500+ Reviews</span>
            <Star size={20} fill="var(--brand-primary)" style={{ color: 'var(--brand-primary)' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;