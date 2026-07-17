import type { Metadata } from 'next';
import ContactClient from '@/features/ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us | Frame by DB',
  description: 'Connect with Dasari Bharadwaj, Director of Photography. Request quotes, consult about event shooting logistics, coordinate outstation travel details, or book our studio team.',
};

export default function ContactPage() {
  return (
    <div className="flex flex-col w-full bg-[#111111] text-white">
      {/* Banner */}
      <section className="py-24 bg-[#0a0a0a] border-b border-white/5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col gap-4">
          <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-sans">Reach Out</span>
          <h1 className="font-serif text-4xl sm:text-6xl">Contact Us</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm font-light">
            Have questions about pricing, dates, or collaboration projects? Drop a line and our team will follow up.
          </p>
        </div>
      </section>

      {/* Contact Layout */}
      <ContactClient />
    </div>
  );
}
