'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 pt-20 pb-8 text-gray-400 font-sans relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        {/* Brand Bio */}
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/do4nuj2kh/image/upload/v1784222954/56fb26d7-1364-4020-ad1d-2cd65e216fe4_dxzyee.png"
              alt="Frame by DB Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-widest text-white">FRAME BY DB</span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37]">Dasari Bharadwaj</span>
            </div>
          </Link>
          <p className="text-sm leading-relaxed text-gray-400 mt-2">
            Award-winning cinematography and luxury photography capture with 16+ years of narrative visual storytelling in Hyderabad and globally.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <a
              href="https://instagram.com/bharadwajdasari"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/5 rounded-full hover:bg-[#D4AF37] hover:text-[#111111] transition-all duration-300 text-white flex items-center justify-center"
              title="Instagram"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="https://facebook.com/bharadwajdasari"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/5 rounded-full hover:bg-[#D4AF37] hover:text-[#111111] transition-all duration-300 text-white flex items-center justify-center"
              title="Facebook"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.9.2-1.2 1-1.2h2V2h-3c-3 0-5 1.8-5 4.8V8z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-5">
          <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-white">Explore</h4>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            <li><Link href="/" className="hover:text-[#D4AF37] transition-colors duration-200">Home</Link></li>
            <li><Link href="/about" className="hover:text-[#D4AF37] transition-colors duration-200">About</Link></li>
            <li><Link href="/services" className="hover:text-[#D4AF37] transition-colors duration-200">Services</Link></li>
            <li><Link href="/portfolio" className="hover:text-[#D4AF37] transition-colors duration-200">Portfolio</Link></li>
            <li><Link href="/gallery" className="hover:text-[#D4AF37] transition-colors duration-200">Gallery</Link></li>
            <li><Link href="/pricing" className="hover:text-[#D4AF37] transition-colors duration-200">Pricing</Link></li>
            <li><Link href="/blog" className="hover:text-[#D4AF37] transition-colors duration-200">Blog</Link></li>
            <li><Link href="/faq" className="hover:text-[#D4AF37] transition-colors duration-200">FAQs</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="flex flex-col gap-5">
          <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-white">Get in Touch</h4>
          <ul className="flex flex-col gap-4 text-sm">
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <a href="tel:+918885060808" className="hover:text-[#D4AF37] transition-colors duration-200">
                +91 88850 60808
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <a href="mailto:dopdasari@gmail.com" className="hover:text-[#D4AF37] transition-colors duration-200">
                dopdasari@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span>Hyderabad, Telangana, India</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col gap-5">
          <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-white">Newsletter</h4>
          <p className="text-sm leading-relaxed">
            Subscribe to receive behind-the-scenes cinema guides and exclusive booking seasons.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2 mt-2">
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-[#111111] border border-white/10 px-4 py-2.5 pr-12 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors duration-300 rounded-none"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="absolute right-0 top-0 h-full px-4 text-[#D4AF37] hover:text-white transition-colors duration-200"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {status === 'success' && (
              <span className="text-[11px] text-[#D4AF37]">Successfully subscribed to the newsletter.</span>
            )}
            {status === 'error' && (
              <span className="text-[11px] text-red-400">Subscription failed. Please try again.</span>
            )}
          </form>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>&copy; {currentYear} Frame by DB. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
          <Link href="/admin" className="hover:text-white transition-colors duration-200">Admin Portal</Link>
        </div>
      </div>
    </footer>
  );
}
