import React from 'react';
import { motion } from 'framer-motion';
import Logo from './common/Logo';

const Hero = () => {
  return (
    <section className="hero-section" id="home">
      <div className="hero-overlay" />
      <div className="hero-content">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <Logo size={80} />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          NexaCivic
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          AI-Powered Civic Engagement Platform
        </motion.p>

        <motion.div className="hero-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <a href="/register" className="btn-primary">Get Started</a>
          <a href="#features" className="btn-secondary">Explore Issues</a>
        </motion.div>
      </div>

      <div className="hero-badges">
        <motion.div className="hero-badge" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
          ✅ AI Issue Detection
        </motion.div>
        <motion.div className="hero-badge" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 0.5 }}>
          📊 Live Status Tracking
        </motion.div>
        <motion.div className="hero-badge" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4.5, delay: 1 }}>
          🛠️ 24/7 Support Workflows
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
