import Link from 'next/link';
import { Camera, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#111111] text-white px-6 text-center">
      <div className="p-4 bg-[#D4AF37]/10 rounded-full text-[#D4AF37] mb-6">
        <Camera className="h-10 w-10 animate-pulse" />
      </div>
      <h1 className="font-serif text-6xl md:text-8xl text-white font-bold tracking-tight mb-4">404</h1>
      <h2 className="font-serif text-xl sm:text-2xl text-[#D4AF37] mb-4">This frame has lost its focus.</h2>
      <p className="text-sm text-gray-400 max-w-md mx-auto mb-10 leading-relaxed font-light">
        The page you are looking for has either been repositioned, renamed, or is temporarily out of scope. Let us guide you back.
      </p>
      
      <Link
        href="/"
        className="px-8 py-3.5 bg-[#D4AF37] text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#111111] transition-all duration-300 flex items-center gap-2"
      >
        Return to Home <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
