'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  type: 'image' | 'drone' | 'video';
  videoUrl?: string;
}

export default function GalleryClient({ items }: { items: GalleryItem[] }) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Photos') return item.type === 'image';
      if (selectedFilter === 'Drone Reels') return item.type === 'drone';
      if (selectedFilter === 'Videos') return item.type === 'video';
      return true;
    });
  }, [items, selectedFilter]);

  const handleNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
    setZoomLevel(1);
  }, [lightboxIndex, filteredItems]);

  const handlePrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    setZoomLevel(1);
  }, [lightboxIndex, filteredItems]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
        setZoomLevel(1);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredItems, handleNext, handlePrev]);

  const toggleZoom = () => {
    setZoomLevel(zoomLevel === 1 ? 1.8 : 1);
  };

  return (
    <div className="flex flex-col w-full bg-[#111111] text-white py-12">
      <div className="max-w-7xl mx-auto px-6 w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-4 mb-16 border-b border-white/5 pb-8 overflow-x-auto">
          {['All', 'Photos', 'Drone Reels', 'Videos'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setSelectedFilter(filter);
                setLightboxIndex(null);
              }}
              className={`px-6 py-2.5 font-sans text-xs uppercase tracking-widest border transition-all duration-300 ${
                selectedFilter === filter
                  ? 'border-[#D4AF37] bg-[#D4AF37] text-[#111111] font-semibold'
                  : 'border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Pinterest Masonry Layout */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              className="break-inside-avoid relative overflow-hidden group cursor-pointer border border-white/5 bg-[#0f0f0f] aspect-auto flex flex-col"
            >
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-[#111111]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] mb-1 font-semibold">{item.category}</span>
                <h3 className="font-serif text-lg text-white">{item.title}</h3>
                {item.type !== 'image' && (
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    <Play className="h-3 w-3 text-[#D4AF37] fill-[#D4AF37]" /> Click to Play
                  </span>
                )}
              </div>
              {item.type !== 'image' && (
                <div className="absolute top-4 right-4 bg-[#D4AF37] p-2 rounded-full text-[#111111]">
                  <Play className="h-3 w-3 fill-[#111111]" />
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-gray-500 font-sans text-sm">
            No items in this category.
          </div>
        )}
      </div>

      {/* Luxury Fullscreen Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#111111]/98 flex flex-col justify-between select-none"
          >
            {/* Header controls */}
            <div className="p-6 flex items-center justify-between text-white z-10">
              <span className="font-sans text-xs uppercase tracking-widest text-gray-400">
                {lightboxIndex + 1} / {filteredItems.length} &mdash; {filteredItems[lightboxIndex].title}
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleZoom}
                  title="Toggle Zoom"
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-[#D4AF37]"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setLightboxIndex(null);
                    setZoomLevel(1);
                  }}
                  title="Close Lightbox"
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex items-center justify-between px-4 sm:px-12 relative overflow-hidden">
              {/* Left Arrow */}
              <button
                onClick={handlePrev}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors z-10 shrink-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* Media Display Container */}
              <div className="flex-1 flex items-center justify-center max-w-4xl h-full p-4 relative">
                <motion.div
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: zoomLevel }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-full max-h-[75vh] flex items-center justify-center relative"
                >
                  {filteredItems[lightboxIndex].type !== 'image' && filteredItems[lightboxIndex].videoUrl ? (
                    <video
                      src={filteredItems[lightboxIndex].videoUrl}
                      controls
                      autoPlay
                      className="max-w-full max-h-[75vh] object-contain border border-white/5 shadow-2xl"
                    />
                  ) : (
                    <img
                      src={filteredItems[lightboxIndex].image}
                      alt={filteredItems[lightboxIndex].title}
                      className="max-w-full max-h-[75vh] object-contain border border-white/5 shadow-2xl transition-transform duration-300 cursor-zoom-in"
                      onClick={toggleZoom}
                    />
                  )}
                </motion.div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors z-10 shrink-0"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Footer label info */}
            <div className="p-6 text-center text-xs text-gray-500 font-sans z-10">
              Use Left/Right arrow keys to navigate, Escape to close. Click the image to zoom.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
