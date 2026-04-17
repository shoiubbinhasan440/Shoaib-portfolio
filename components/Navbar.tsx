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
    { href: '/', label: 'Home' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/tutorial', label: 'Tutorial' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950 px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white" style={{ fontFamily: 'cursive' }}>
            Sayeed Fahad
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href
                    ? 'text-blue-400 font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm8-8a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zM5 11H4a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2zm11.95-6.364a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zM8.172 15.828a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zm9.9 1.414a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414zM8.172 8.172a1 1 0 0 1-1.414 0l-.707-.707A1 1 0 0 1 7.465 6.05l.707.707a1 1 0 0 1 0 1.414zM12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            <Link href="/admin/login" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors">
              Login
            </Link>
          </div>

          {/* Mobile Right Side */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm8-8a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zM5 11H4a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2zm11.95-6.364a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zM8.172 15.828a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zm9.9 1.414a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414zM8.172 8.172a1 1 0 0 1-1.414 0l-.707-.707A1 1 0 0 1 7.465 6.05l.707.707a1 1 0 0 1 0 1.414zM12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            >
              <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}/>
              <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`}/>
              <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}/>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-gray-950 flex flex-col pt-20 px-6" style={{top: '65px'}}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`py-4 text-lg border-b border-gray-800 transition-colors ${
                pathname === link.href ? 'text-blue-400 font-medium' : 'text-gray-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            onClick={() => setMenuOpen(false)}
            className="mt-6 text-center bg-blue-600 text-white py-3 rounded-full text-sm font-medium"
          >
            Login
          </Link>
        </div>
      )}
    </>
  );
}