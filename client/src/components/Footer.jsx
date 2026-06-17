import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './common/Logo';

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-content">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Logo size={40} />
          <h4 style={{ margin: 0 }}>NexaCivic</h4>
        </div>
        <p>Transforming Community Issues into Smart Solutions</p>
      </div>
      <div className="footer-links">
        <h5>Quick Links</h5>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/login">Login</Link>
      </div>
      <div className="footer-links">
        <h5>Contact</h5>
        <p>nexacivic.app@gmail.com</p>
      </div>
    </div>
    <div className="footer-bottom">© {new Date().getFullYear()} NexaCivic. All rights reserved.</div>
  </footer>
);

export default Footer;
