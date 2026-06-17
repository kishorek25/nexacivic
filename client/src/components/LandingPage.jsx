import React, { useState } from 'react';
import Hero from './Hero';
import Features from './Features';
import HowItWorks from './HowItWorks';
import Benefits from './Benefits';
import Footer from './Footer';
import HelpChatbot from './HelpChatbot';
import CallCenterModal from './CallCenterModal';

const LandingPage = () => {
  const [showCallModal, setShowCallModal] = useState(false);

  return (
    <>
      <main className="landing-container">
        <Hero />
        <Features />
        <HowItWorks />
        <Benefits />
        <Footer />
        <HelpChatbot />
      </main>

      {/* Floating Call Button - Positioned at bottom-left to avoid overlap with chatbot */}
      <button
        onClick={() => setShowCallModal(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.5)',
          zIndex: 9999,
          fontSize: '1.4rem',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(37, 99, 235, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.5)';
        }}
        title="Report via Call"
      >
        📞
      </button>

      <CallCenterModal isOpen={showCallModal} onClose={() => setShowCallModal(false)} />
    </>
  );
};

export default LandingPage;
