'use client';

import { useState, useMemo } from 'react';
import { Search, MapPin, Calendar, User, Film, Play, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface PortfolioItem {
  id: string;
  title: string;
  client: string;
  category: string;
  location: string;
  date: string;
  image: string;
  videoUrl?: string;
  details: string;
}

export default function PortfolioClient({ items }: { items: PortfolioItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category));
    return ['All', ...Array.from(cats)];
  }, [items]);

  // Filter & Search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Related projects recommendation
  const relatedProjects = useMemo(() => {
    if (!selectedProject) return [];
    return items
      .filter((item) => item.category === selectedProject.category && item.id !== selectedProject.id)
      .slice(0, 3);
  }, [selectedProject, items]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#111111] text-white py-12">
      <div className="max-w-7xl mx-auto px-6 w-full">
        {/* Controls Layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 font-sans text-xs uppercase tracking-widest border transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-[#111111] font-semibold'
                    : 'border-white/10 hover:border-white/30 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Portfolio Projects Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                key={item.id}
                onClick={() => setSelectedProject(item)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/5] overflow-hidden bg-zinc-900 border border-white/5 relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-6">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-1 font-semibold">
                      {item.category}
                    </span>
                    <h3 className="font-serif text-xl text-white mb-2">{item.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                      <MapPin className="h-3 w-3 text-[#D4AF37]" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                  {item.videoUrl && (
                    <div className="absolute top-4 right-4 p-2.5 bg-[#D4AF37] rounded-full text-[#111111]">
                      <Film className="h-4.5 w-4.5" />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-1 md:hidden">
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]">{item.category}</span>
                  <h3 className="font-serif text-lg text-white">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-gray-500 font-sans text-sm">
            No projects found matching the criteria.
          </div>
        )}
      </div>

      {/* Fullscreen project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#111111]/95 backdrop-blur-md overflow-y-auto px-6 py-20"
          >
            <div className="max-w-5xl mx-auto flex flex-col gap-8 relative">
              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute -top-12 right-0 p-3 bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all rounded-full"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Title Header */}
              <div>
                <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-sans font-semibold mb-2 block">
                  {selectedProject.category}
                </span>
                <h2 className="font-serif text-3xl sm:text-5xl text-white leading-tight">
                  {selectedProject.title}
                </h2>
              </div>

              {/* Video Player or Main Image */}
              {selectedProject.videoUrl ? (
                <div className="w-full aspect-video border border-white/5 bg-[#0a0a0a]">
                  <video
                    src={selectedProject.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[16/9] overflow-hidden border border-white/5 bg-zinc-900">
                  <img
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Metadata Details Column */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-4">
                {/* Meta details list */}
                <div className="flex flex-col gap-6 bg-[#0a0a0a] p-8 border border-white/5">
                  <div className="flex items-center gap-4">
                    <User className="h-5 w-5 text-[#D4AF37] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block">Client</span>
                      <span className="text-sm font-semibold text-white">{selectedProject.client}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <MapPin className="h-5 w-5 text-[#D4AF37] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block">Location</span>
                      <span className="text-sm font-semibold text-white">{selectedProject.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-[#D4AF37] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block">Release Date</span>
                      <span className="text-sm font-semibold text-white">{selectedProject.date}</span>
                    </div>
                  </div>
                </div>

                {/* Narrative Details */}
                <div className="lg:col-span-2 flex flex-col gap-6 justify-center">
                  <h3 className="font-serif text-xl text-[#D4AF37]">Project Summary</h3>
                  <p className="text-sm leading-relaxed text-gray-300 font-light">
                    {selectedProject.details}
                  </p>
                  <Link
                    href="/book"
                    onClick={() => setSelectedProject(null)}
                    className="w-fit px-8 py-3 bg-[#D4AF37] text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-bold hover:bg-white transition-all duration-300"
                  >
                    Discuss Similar Project
                  </Link>
                </div>
              </div>

              {/* Related Projects */}
              {relatedProjects.length > 0 && (
                <div className="border-t border-white/5 pt-12 mt-8">
                  <h3 className="font-serif text-2xl text-white mb-6">Related Projects</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {relatedProjects.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedProject(item)}
                        className="group cursor-pointer flex flex-col"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-zinc-900 border border-white/5">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <h4 className="font-serif text-sm text-white group-hover:text-[#D4AF37] transition-colors mt-3">
                          {item.title}
                        </h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
