'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session-based loading screen to avoid displaying it repeatedly during navigation
    const hasLoaded = sessionStorage.getItem('site_loaded');
    if (hasLoaded) {
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem('site_loaded', 'true');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            y: -50,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
          }}
          className="fixed inset-0 z-[10000] bg-[#111111] flex flex-col items-center justify-center text-white"
        >
          <div className="overflow-hidden mb-2">
            <motion.h1
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-3xl md:text-4xl tracking-[0.2em]"
            >
              DASARI BHARADWAJ
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.p
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-[#D4AF37] text-xs uppercase tracking-[0.4em] font-sans"
            >
              FRAME BY DB
            </motion.p>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "120px" }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
            className="h-[1px] bg-[#D4AF37]/50 mt-8"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
