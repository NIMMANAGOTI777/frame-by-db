'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Calendar, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on path changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Blog', path: '/blog' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#111111]/85 backdrop-blur-md border-b border-white/5 py-4Shadow shadow-xl'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="https://res.cloudinary.com/do4nuj2kh/image/upload/v1784222954/56fb26d7-1364-4020-ad1d-2cd65e216fe4_dxzyee.png"
              alt="Frame by DB Logo"
              className="h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-widest text-white group-hover:text-[#D4AF37] transition-colors duration-300">
                FRAME BY DB
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37] font-sans">
                Dasari Bharadwaj
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-300 relative py-1 ${
                    isActive ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.span
                      layoutId="navUnderline"
                      className="absolute bottom-0 left-0 w-full h-[1px] bg-[#D4AF37]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA Book Now */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/contact"
              className="p-2 border border-white/10 rounded-full hover:border-[#D4AF37]/50 transition-colors duration-300"
              title="Call Us"
            >
              <Phone className="h-4 w-4 text-[#D4AF37]" />
            </Link>
            <Link
              href="/book"
              className="relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-sans text-xs uppercase tracking-[0.2em] text-white border border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-none group transition-all duration-300 bg-transparent"
            >
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform -translate-x-full bg-[#D4AF37] group-hover:translate-x-0"></span>
              <span className="relative flex items-center gap-2 group-hover:text-[#111111]">
                <Calendar className="h-3.5 w-3.5" /> Book Now
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white hover:text-[#D4AF37] transition-colors duration-300 p-2"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#111111] flex flex-col justify-center px-8 py-20 lg:hidden"
          >
            {/* Background grid accents */}
            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />

            <div className="relative flex flex-col items-center gap-6 text-center">
              {navLinks.map((link, idx) => {
                const isActive = pathname === link.path;
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`font-serif text-2xl tracking-wider transition-colors duration-300 ${
                        isActive ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
                className="mt-8"
              >
                <Link
                  href="/book"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#D4AF37] text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-semibold hover:bg-white hover:text-[#111111] transition-all duration-300"
                >
                  <Calendar className="h-4 w-4" /> Book Now
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
