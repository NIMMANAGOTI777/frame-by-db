'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#111111] text-white px-6 text-center">
      <div className="p-4 bg-red-500/10 rounded-full text-red-400 mb-6">
        <AlertTriangle className="h-10 w-10 animate-pulse" />
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl text-white mb-4">Something went wrong</h1>
      <p className="text-sm text-gray-400 max-w-md mx-auto mb-10 leading-relaxed font-light font-sans">
        An unexpected error occurred in this view frame. Try resetting the render screen or navigating home.
      </p>
      
      <button
        onClick={() => reset()}
        className="px-8 py-3.5 bg-[#D4AF37] text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#111111] transition-all duration-300 flex items-center gap-2 cursor-pointer"
      >
        Reset Frame <RefreshCw className="h-4 w-4" />
      </button>
    </div>
  );
}
