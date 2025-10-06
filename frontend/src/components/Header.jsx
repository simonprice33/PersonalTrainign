import React, { useState } from 'react';
import { Menu, X, Phone, Mail } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="network-header fixed top-0 w-full z-50" style={{ background: 'var(--bg-page)' }}>
      <div className="container">
        <div className="nav-wrapper" style={{
          background: 'var(--brand-dark)',
          borderRadius: '25px',
          padding: '8px 16px',
          margin: '16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0, 191, 255, 0.25)'
        }}>
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_personal-trainer-24/artifacts/3u7xdkqr_87f3e4cd-295c-463d-ab0d-2f0bb37ee9c2.png" 
              alt="Simon Price Personal Training" 
              className="h-12 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => scrollToSection('home')}
              className="network-nav-link text-white hover:bg-white hover:bg-opacity-10 px-4 py-2 rounded-full transition-all duration-200"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="network-nav-link text-white hover:bg-white hover:bg-opacity-10 px-4 py-2 rounded-full transition-all duration-200"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="network-nav-link text-white hover:bg-white hover:bg-opacity-10 px-4 py-2 rounded-full transition-all duration-200"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="network-nav-link text-white hover:bg-white hover:bg-opacity-10 px-4 py-2 rounded-full transition-all duration-200"
            >
              Testimonials
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="btn-primary ml-4"
              style={{ background: 'var(--brand-primary)', color: 'var(--brand-dark)' }}
            >
              Get Started
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMenu}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 p-4 rounded-2xl" style={{ background: 'var(--brand-dark)' }}>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-white text-left py-2 hover:bg-white hover:bg-opacity-10 px-4 rounded-full transition-all duration-200"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="text-white text-left py-2 hover:bg-white hover:bg-opacity-10 px-4 rounded-full transition-all duration-200"
              >
                Services
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-white text-left py-2 hover:bg-white hover:bg-opacity-10 px-4 rounded-full transition-all duration-200"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-white text-left py-2 hover:bg-white hover:bg-opacity-10 px-4 rounded-full transition-all duration-200"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="btn-primary mt-2"
                style={{ background: 'var(--brand-primary)', color: 'var(--brand-dark)' }}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;