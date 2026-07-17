import { readDB } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Share2 } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function BlogPostPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const db = await readDB();
  const blog = db.blogs.find((b) => b.slug === slug);

  if (!blog) {
    notFound();
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col w-full bg-[#111111] text-white py-12">
      <div className="max-w-3xl mx-auto px-6 w-full mt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Journal
        </Link>

        {/* Article Header Meta */}
        <div className="flex flex-col gap-4 mb-8">
          <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
            {blog.category}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-white leading-tight">
            {blog.title}
          </h1>
          <div className="flex items-center gap-6 text-xs text-gray-500 font-sans uppercase tracking-widest mt-2 border-b border-white/5 pb-6">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {blog.readTime} Read</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(blog.createdAt)}</span>
          </div>
        </div>

        {/* Cover Image */}
        <div className="w-full aspect-[16/10] overflow-hidden border border-white/5 bg-zinc-900 mb-12">
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Editorial Body */}
        <article className="max-w-none text-gray-300 font-sans text-sm md:text-base leading-relaxed space-y-6">
          {blog.content.split('\n\n').map((paragraph: string, idx: number) => {
            if (paragraph.startsWith('###')) {
              return (
                <h3 key={idx} className="font-serif text-xl text-white mt-8 mb-4">
                  {paragraph.replace('###', '').trim()}
                </h3>
              );
            }
            if (paragraph.startsWith('##')) {
              return (
                <h2 key={idx} className="font-serif text-2xl text-white mt-8 mb-4">
                  {paragraph.replace('##', '').trim()}
                </h2>
              );
            }
            if (paragraph.startsWith('-')) {
              return (
                <ul key={idx} className="list-disc pl-6 space-y-2 my-4">
                  {paragraph.split('\n').map((li, liIdx) => (
                    <li key={liIdx} className="font-light">
                      {li.replace('-', '').trim()}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} className="font-light">
                {paragraph}
              </p>
            );
          })}
        </article>

        {/* Share Section */}
        <div className="border-t border-b border-white/5 py-6 my-12 flex items-center justify-between text-xs text-gray-500 font-sans">
          <span>Published by Dasari Bharadwaj</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <Share2 className="h-4 w-4 text-[#D4AF37]" /> Share Article
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
