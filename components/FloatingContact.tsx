'use client';

import { Phone, MessageCircle } from 'lucide-react';

export default function FloatingContact() {
  return (
    <div className="fixed bottom-6 left-6 z-45 flex flex-col gap-3">
      {/* WhatsApp Action */}
      <a
        href="https://wa.me/918885060808?text=Hi%20Bharadwaj,%20I%20would%20like%20to%20inquire%20about%20a%20shoot%20booking."
        target="_blank"
        rel="noopener noreferrer"
        className="p-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="h-5.5 w-5.5 fill-white text-[#25D366]" />
      </a>

      {/* Phone Action */}
      <a
        href="tel:+918885060808"
        className="p-3.5 bg-[#D4AF37] hover:bg-[#bda032] text-[#111111] rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center"
        title="Call Us Now"
      >
        <Phone className="h-5.5 w-5.5 fill-[#111111]" />
      </a>
    </div>
  );
}
