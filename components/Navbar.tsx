'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = pathname.startsWith('/admin');
  if (isAdmin) return null;

  const links = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/portfolio', label: 'Portfolio', icon: '🎬' },
    { href: '/tutorial', label: 'Tutorial', icon: '🎓' },
    { href: '/about', label: 'About', icon: '👤' },
    { href: '/contact', label: 'Contact', icon: '✉️' },
  ];

  return (
    <>
      <style>{`
        .glass-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(10, 10, 20, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .glass-logo {
          font-size: 18px;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.5px;
          font-family: cursive;
        }
        .glass-logo span { color: #a78bfa; }
        .glass-desktop-links {
          display: none;
          gap: 28px;
          align-items: center;
        }
        @media(min-width: 768px) {
          .glass-desktop-links { display: flex; }
          .glass-mobile-right { display: none !important; }
          .glass-overlay { display: none !important; }
        }
        .glass-desktop-links a {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 500;
        }
        .glass-desktop-links a:hover,
        .glass-desktop-links a.active { color: #fff; }
        .glass-toggle-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(10px);
        }
        .glass-login-btn {
          padding: 7px 18px;
          border-radius: 99px;
          background: rgba(167,139,250,0.15);
          border: 1px solid rgba(167,139,250,0.3);
          color: #a78bfa;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
        }
        .glass-login-btn:hover {
          background: rgba(167,139,250,0.25);
        }
        .glass-mobile-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .glass-ham-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          backdrop-filter: blur(10px);
        }
        .glass-ham-btn span {
          display: block;
          height: 1.5px;
          background: #fff;
          border-radius: 2px;
          transition: all 0.3s;
        }
        .glass-ham-btn span:nth-child(1) { width: 18px; }
        .glass-ham-btn span:nth-child(2) { width: 12px; }
        .glass-ham-btn.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
          width: 18px;
        }
        .glass-ham-btn.open span:nth-child(2) { opacity: 0; }

        /* Full screen glass overlay */
        .glass-overlay {
          position: fixed;
          inset: 0;
          z-index: 49;
          background: rgba(5, 5, 15, 0.85);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          padding: 90px 28px 40px;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .glass-overlay-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          text-decoration: none;
          cursor: pointer;
        }
        .glass-overlay-item:last-of-type { border: none; }
        .glass-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          backdrop-filter: blur(10px);
        }
        .glass-icon-wrap.active-icon {
          background: rgba(167,139,250,0.15);
          border-color: rgba(167,139,250,0.3);
        }
        .glass-item-text { flex: 1; }
        .glass-item-label {
          font-size: 17px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          display: block;
        }
        .glass-item-label.active-label { color: #a78bfa; }
        .glass-item-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          display: block;
          margin-top: 2px;
        }
        .glass-item-arrow {
          color: rgba(255,255,255,0.2);
          font-size: 16px;
        }
        .glass-item-arrow.active-arrow { color: #a78bfa; }
        .glass-overlay-bottom {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .glass-login-full {
          display: block;
          text-align: center;
          padding: 14px;
          border-radius: 14px;
          background: rgba(167,139,250,0.15);
          border: 1px solid rgba(167,139,250,0.25);
          color: #a78bfa;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          backdrop-filter: blur(10px);
        }
        .glass-theme-full {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          font-weight: 500;
        }
      `}</style>

      {/* Navbar */}
      <nav className="glass-nav">
        <Link href="/" className="glass-logo">
          Sayeed <span>Fahad</span>
        </Link>

        {/* Desktop */}
        <div className="glass-desktop-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
          <button onClick={toggleTheme} className="glass-toggle-btn">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/admin/login" className="glass-login-btn">Login</Link>
        </div>

        {/* Mobile */}
        <div className="glass-mobile-right">
          <button onClick={toggleTheme} className="glass-toggle-btn">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            className={`glass-ham-btn ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /><span />
          </button>
        </div>
      </nav>

      {/* Glass Overlay Menu */}
      {menuOpen && (
        <div className="glass-overlay">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const subs: Record<string, string> = {
              '/': 'ফিরে যান',
              '/portfolio': 'আমার কাজ দেখুন',
              '/tutorial': 'শেখার ভিডিও',
              '/about': 'আমার পরিচয়',
              '/contact': 'যোগাযোগ করুন',
            };
            return (
              <Link
                key={link.href}
                href={link.href}
                className="glass-overlay-item"
                onClick={() => setMenuOpen(false)}
              >
                <div className={`glass-icon-wrap ${isActive ? 'active-icon' : ''}`}>
                  {link.icon}
                </div>
                <div className="glass-item-text">
                  <span className={`glass-item-label ${isActive ? 'active-label' : ''}`}>
                    {link.label}
                  </span>
                  <span className="glass-item-sub">{subs[link.href]}</span>
                </div>
                <span className={`glass-item-arrow ${isActive ? 'active-arrow' : ''}`}>›</span>
              </Link>
            );
          })}

          <div className="glass-overlay-bottom">
            <Link
              href="/admin/login"
              className="glass-login-full"
              onClick={() => setMenuOpen(false)}
            >
              🔐 Admin Login
            </Link>
            <button className="glass-theme-full" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}