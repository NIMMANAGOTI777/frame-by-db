'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Clock, Calendar, ArrowRight, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Blog {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  readTime: string;
  image: string;
  createdAt: string;
  isFeatured: boolean;
}

export default function BlogClient({ blogs }: { blogs: Blog[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract categories dynamically
  const categories = useMemo(() => {
    const cats = new Set(blogs.map((b) => b.category));
    return ['All', ...Array.from(cats)];
  }, [blogs]);

  // Filter & Search
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
      const matchesSearch =
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  // Find the featured post
  const featuredPost = useMemo(() => {
    return blogs.find((b) => b.isFeatured) || blogs[0];
  }, [blogs]);

  // Regular posts (excluding the featured one when "All" is active)
  const listPosts = useMemo(() => {
    if (selectedCategory !== 'All' || searchQuery !== '') return filteredBlogs;
    return filteredBlogs.filter((b) => b.id !== featuredPost?.id);
  }, [filteredBlogs, selectedCategory, searchQuery, featuredPost]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col w-full bg-[#111111] text-white py-12">
      <div className="max-w-7xl mx-auto px-6 w-full">
        {/* Featured Post Card (Visible only when no filters are set) */}
        {selectedCategory === 'All' && searchQuery === '' && featuredPost && (
          <div className="mb-20 border border-white/5 bg-[#0f0f0f] grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
            <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto overflow-hidden bg-zinc-900 relative">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover hover:scale-103 transition-transform duration-700"
              />
            </div>
            <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold bg-[#111111] border border-white/10 px-3 py-1 w-fit">
                  Featured Article
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white hover:text-[#D4AF37] transition-colors leading-tight">
                  <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>
                <p className="text-xs text-gray-400 font-light leading-relaxed">
                  {featuredPost.summary}
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-6">
                <div className="flex items-center gap-6 text-[10px] text-gray-500 font-sans uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {featuredPost.readTime}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(featuredPost.createdAt)}</span>
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="w-fit flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-[#D4AF37] hover:text-white transition-colors pb-1 border-b border-[#D4AF37]/30 hover:border-white"
                >
                  Read Full Article <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
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
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Editorial Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listPosts.map((blog) => (
            <Link href={`/blog/${blog.slug}`} key={blog.id} className="group flex flex-col bg-[#0f0f0f] border border-white/5 overflow-hidden">
              <div className="aspect-[16/10] overflow-hidden bg-zinc-900 relative">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-103"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                    {blog.category}
                  </span>
                  <h3 className="font-serif text-lg text-white group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-light leading-relaxed line-clamp-2">
                    {blog.summary}
                  </p>
                </div>
                
                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 uppercase tracking-widest font-sans">
                  <span>{blog.readTime} Read</span>
                  <span>{formatDate(blog.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredBlogs.length === 0 && (
          <div className="text-center py-20 text-gray-500 font-sans text-sm">
            No articles found matching the criteria.
          </div>
        )}
      </div>
    </div>
  );
}
