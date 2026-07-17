'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

export default function ContactClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
        if (data.errors && Array.isArray(data.errors)) {
          const detail = data.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
          setErrorMessage(detail || data.message || 'Sending failed. Please check your inputs.');
        } else {
          setErrorMessage(data.message || 'Sending failed. Please check your inputs and try again.');
        }
      }
    } catch {
      setStatus('error');
      setErrorMessage('Server connection error. Please try again.');
    }
  };

  return (
    <section className="py-20 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
      {/* Info Column */}
      <div className="lg:col-span-5 flex flex-col gap-10">
        <div>
          <h2 className="font-serif text-2xl text-white mb-2">Connect Directly</h2>
          <p className="text-xs text-gray-400 font-sans">Dasari Bharadwaj &bull; Dopdasari@gmail.com</p>
        </div>

        {/* Details list */}
        <div className="flex flex-col gap-6 font-sans text-xs">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <span className="text-gray-500 uppercase tracking-wider block mb-0.5">Call / WhatsApp</span>
              <a href="tel:+918885060808" className="text-sm font-semibold hover:text-[#D4AF37] transition-colors">
                +91 88850 60808
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <span className="text-gray-500 uppercase tracking-wider block mb-0.5">Email Inquiry</span>
              <a href="mailto:dopdasari@gmail.com" className="text-sm font-semibold hover:text-[#D4AF37] transition-colors">
                dopdasari@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <span className="text-gray-500 uppercase tracking-wider block mb-0.5">Studio Location</span>
              <span className="text-sm font-semibold">Hyderabad, Telangana, India</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-gray-500 uppercase tracking-wider block mb-0.5">Studio Hours</span>
              <span className="text-sm font-semibold text-white">Mon &mdash; Sat: 10:00 AM to 7:00 PM IST</span>
            </div>
          </div>
        </div>

        {/* Social connections */}
        <div className="flex items-center gap-4 border-t border-white/5 pt-8">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-sans">Socials</span>
          <a
            href="https://instagram.com/bharadwajdasari"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-white/5 hover:bg-[#D4AF37] hover:text-[#111111] transition-all rounded-full text-white flex items-center justify-center"
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
            className="p-2.5 bg-white/5 hover:bg-[#D4AF37] hover:text-[#111111] transition-all rounded-full text-white flex items-center justify-center"
            title="Facebook"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.9.2-1.2 1-1.2h2V2h-3c-3 0-5 1.8-5 4.8V8z" />
            </svg>
          </a>
        </div>

        {/* Styled Google Maps Placeholders */}
        <div className="aspect-video w-full border border-white/5 bg-[#0a0a0a] relative overflow-hidden p-6 flex flex-col justify-end">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div className="z-10 flex flex-col">
            <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-sans font-bold">Studio Hub</span>
            <span className="text-sm font-serif text-white mt-1">Jubilee Hills, Hyderabad</span>
            <span className="text-[10px] text-gray-500 font-sans mt-0.5">Physical consultation by appointment only</span>
          </div>
        </div>
      </div>

      {/* Contact Form Column */}
      <div className="lg:col-span-7 p-8 md:p-12 border border-white/5 bg-[#0f0f0f] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl" />
        <h2 className="font-serif text-2xl text-white mb-2 flex items-center gap-2">
          <Send className="h-5 w-5 text-[#D4AF37]" /> Drop Us a Message
        </h2>
        <p className="text-xs text-gray-400 mb-8 font-light leading-relaxed font-sans">
          Fill in the information below. We typically review and respond to general inquiries within 24 hours.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 font-sans text-xs">
            <label htmlFor="contact-form-name" className="text-[10px] uppercase tracking-widest text-gray-400">Full Name</label>
            <input
              id="contact-form-name"
              type="text"
              required
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-none"
              autoComplete="name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5 font-sans text-xs">
              <label htmlFor="contact-form-email" className="text-[10px] uppercase tracking-widest text-gray-400">Email Address</label>
              <input
                id="contact-form-email"
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-none"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5 font-sans text-xs">
              <label htmlFor="contact-form-phone" className="text-[10px] uppercase tracking-widest text-gray-400">Phone Number</label>
              <input
                id="contact-form-phone"
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-none"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 font-sans text-xs">
            <label htmlFor="contact-form-msg" className="text-[10px] uppercase tracking-widest text-gray-400">Your Message</label>
            <textarea
              id="contact-form-msg"
              required
              rows={6}
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Details about your collaboration, event, or special request..."
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none rounded-none"
            />
          </div>

          <div className="mt-2">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 rounded-none"
            >
              {status === 'loading' ? 'Sending Message...' : 'Send Message'}
            </button>
            {status === 'success' && (
              <p className="text-[11px] text-[#D4AF37] mt-4 text-center">Your message was sent successfully! We will contact you shortly.</p>
            )}
            {status === 'error' && (
              <p className="text-[11px] text-red-400 mt-4 text-center">
                {errorMessage || 'Sending failed. Please check your inputs and try again.'}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
