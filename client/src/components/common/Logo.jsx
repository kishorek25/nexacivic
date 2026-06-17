import React from 'react';

const Logo = ({ size = 46, showText = false, className = '' }) => (
  <div className={`logo-wrapper ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <img
      src="/logo.png"
      alt="NexaCivic Logo"
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        borderRadius: '12px',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
      }}
    />
    {showText && (
      <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', letterSpacing: '0.03em' }}>
        NexaCivic
      </span>
    )}
  </div>
);

export default Logo;
