import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, UserCircle, LogOut, Sun, Moon, MessageSquare, Globe, Bot, Trophy, Home, Users, Info, ChevronRight, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './common/Logo';

const Navbar = ({ user, onLogout, theme, toggleTheme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { t, i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const menuItems = user ? [
    { label: t('dashboard', 'Dashboard'), href: '/', icon: Home, highlight: true },
    { label: t('community', 'Community'), href: '/community', icon: Users },
    { label: t('leaderboard', 'Leaderboard'), href: '/leaderboard', icon: Trophy },
    { label: t('about', 'About'), href: '/about', icon: Info },
  ] : [];

  const bottomMenuItems = user ? [
    ...(user.role === 'staff' || user.role === 'admin' ? [
      { label: t('callCenter', 'Call Center'), href: '/callcenter', icon: Phone },
    ] : []),
    ...(user.role !== 'admin' ? [
      { label: t('messages', 'Messages'), href: '/chats', icon: MessageSquare },
    ] : []),
    { label: t('assistant', 'Assistant'), href: '/assistant', icon: Bot },
    { label: t('profile', 'Profile'), href: '/profile', icon: UserCircle },
  ] : [];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'hi', label: 'हिन्दी' },
  ];

  const isActive = (href) => {
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header className="main-nav glass-panel sticky-nav animate-fade-in">
        <div className="nav-left">
          <Link to="/" className="logo">
            <Logo size={46} showText={true} />
          </Link>
        </div>

        <div className="nav-right">
          {user && (
            <Link to="/" className={`nav-dashboard-link ${location.pathname === '/' ? 'active' : ''}`}>
              <Home size={18} />
              <span>{t('dashboard', 'Dashboard')}</span>
            </Link>
          )}

          <button 
            className="menu-toggle-btn" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div 
        ref={menuRef}
        className={`slide-menu ${menuOpen ? 'open' : ''}`}
      >
        <div className="slide-menu-content">
          {user ? (
            <>
              <div className="menu-header">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{user.role?.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="menu-section">
                <span className="menu-section-title">{t('navigation', 'Navigation')}</span>
                <nav className="menu-nav">
                  {menuItems.map((item) => (
                    <Link 
                      key={item.href}
                      to={item.href} 
                      className={`menu-item ${isActive(item.href) ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <item.icon size={20} className="menu-item-icon" />
                      <span className="menu-item-label">{item.label}</span>
                      {isActive(item.href) && <ChevronRight size={16} className="active-indicator" />}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="menu-section">
                <span className="menu-section-title">{t('quickAccess', 'Quick Access')}</span>
                <nav className="menu-nav">
                  {bottomMenuItems.map((item) => (
                    <Link 
                      key={item.href}
                      to={item.href} 
                      className={`menu-item ${isActive(item.href) ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <item.icon size={20} className="menu-item-icon" />
                      <span className="menu-item-label">{item.label}</span>
                      {isActive(item.href) && <ChevronRight size={16} className="active-indicator" />}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="menu-section">
                <span className="menu-section-title">{t('preferences', 'Preferences')}</span>
                <div className="menu-nav">
                  <div className="menu-item language-selector">
                    <Globe size={20} className="menu-item-icon" />
                    <span className="menu-item-label">{t('language', 'Language')}</span>
                  </div>
                  <div className="language-options">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className={`language-btn ${i18n.language === lang.code ? 'active' : ''}`}
                        onClick={() => i18n.changeLanguage(lang.code)}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>

                  <button className="menu-item theme-toggle" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    <span className="menu-item-label">
                      {theme === 'dark' ? t('lightMode', 'Light Mode') : t('darkMode', 'Dark Mode')}
                    </span>
                  </button>
                </div>
              </div>

              <div className="menu-footer">
                <button className="logout-btn" onClick={onLogout}>
                  <LogOut size={20} />
                  <span>{t('logout', 'Logout')}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="menu-header">
                <span className="guest-title">{t('welcome', 'Welcome to NexaCivic')}</span>
              </div>

              <div className="menu-section">
                <nav className="menu-nav">
                  <Link to="/login" className="menu-item" onClick={() => setMenuOpen(false)}>
                    <span className="menu-item-label">{t('login', 'Login')}</span>
                  </Link>
                  <Link to="/register" className="menu-item primary" onClick={() => setMenuOpen(false)}>
                    <span className="menu-item-label">{t('register', 'Register')}</span>
                  </Link>
                </nav>
              </div>

              <div className="menu-section">
                <span className="menu-section-title">{t('preferences', 'Preferences')}</span>
                <div className="menu-nav">
                  <div className="menu-item language-selector">
                    <Globe size={20} className="menu-item-icon" />
                    <span className="menu-item-label">{t('language', 'Language')}</span>
                  </div>
                  <div className="language-options">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className={`language-btn ${i18n.language === lang.code ? 'active' : ''}`}
                        onClick={() => i18n.changeLanguage(lang.code)}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div 
        className={`menu-overlay ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <style>{`
        .main-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1.5rem;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: transform 300ms ease;
        }

        .logo:hover {
          transform: scale(1.05);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .nav-dashboard-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          transition: all 0.25s ease;
        }

        .nav-dashboard-link:hover,
        .nav-dashboard-link.active {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .menu-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: none;
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .menu-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .slide-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 320px;
          max-width: 85vw;
          height: 100vh;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95));
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1001;
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .slide-menu.open {
          transform: translateX(0);
        }

        .slide-menu-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .slide-menu-content::-webkit-scrollbar {
          width: 6px;
        }

        .slide-menu-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .slide-menu-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .menu-header {
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          font-size: 1rem;
          color: #fff;
        }

        .user-role {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.05em;
        }

        .guest-title {
          font-weight: 600;
          font-size: 1.1rem;
          color: #fff;
        }

        .menu-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .menu-section-title {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.4);
          padding-left: 0.5rem;
        }

        .menu-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .menu-item.active {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
          color: #fff;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .menu-item.primary {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #fff;
          justify-content: center;
        }

        .menu-item.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }

        .menu-item-icon {
          opacity: 0.8;
          flex-shrink: 0;
        }

        .menu-item.active .menu-item-icon {
          opacity: 1;
          color: var(--success);
        }

        .menu-item-label {
          flex: 1;
        }

        .active-indicator {
          opacity: 0.5;
        }

        .language-selector {
          pointer-events: none;
        }

        .language-options {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          margin-left: 2.75rem;
        }

        .language-btn {
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .language-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .language-btn.active {
          background: rgba(16, 185, 129, 0.2);
          border-color: var(--success);
          color: #fff;
        }

        .theme-toggle {
          margin-top: 0.25rem;
        }

        .menu-footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          transform: translateY(-2px);
        }

        .menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .menu-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        @media (max-width: 640px) {
          .nav-dashboard-link span {
            display: none;
          }

          .nav-dashboard-link {
            padding: 0.5rem;
            border-radius: 10px;
          }

          .menu-toggle-btn {
            width: 38px;
            height: 38px;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
