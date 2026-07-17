'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQClient({ items }: { items: FAQ[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return ['All', ...Array.from(cats)];
  }, [items]);

  // Filter & Search FAQs
  const filteredFAQs = useMemo(() => {
    return items.filter((faq) => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="flex flex-col w-full bg-[#111111] text-white py-12">
      <div className="max-w-4xl mx-auto px-6 w-full">
        {/* Controls Layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 font-sans text-xs uppercase tracking-widest border transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-[#111111] font-semibold'
                    : 'border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* FAQ Accordions */}
        <div className="flex flex-col gap-4">
          {filteredFAQs.map((faq) => {
            const isOpen = openIndex === faq.id;
            return (
              <div
                key={faq.id}
                className={`border transition-colors duration-300 ${
                  isOpen ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/5 bg-[#0f0f0f]'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left font-sans text-sm md:text-base"
                >
                  <span className="font-semibold text-white flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-[#D4AF37] shrink-0" />
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-[#D4AF37]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-xs md:text-sm text-gray-400 font-light leading-relaxed border-t border-white/5 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-20 text-gray-500 font-sans text-sm">
            No matching questions found.
          </div>
        )}
      </div>
    </div>
  );
}
