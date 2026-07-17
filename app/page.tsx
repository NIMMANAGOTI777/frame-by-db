import Link from 'next/link';
import { readDB } from '@/lib/db';
import { Play, Calendar, Award, ArrowRight, Camera, Film, Compass } from 'lucide-react';

export const revalidate = 0; // Ensure data is loaded fresh from JSON file

export default async function Home() {
  const db = await readDB();
  const { settings, portfolio, testimonials, blogs } = db;
  
  const featuredPortfolio = portfolio.slice(0, 3);
  const recentBlogs = blogs.slice(0, 3);

  // Quick categories
  const categories = [
    { name: 'Weddings & Films', icon: Film, desc: 'Luxury grand Indian weddings and cinematic stories.' },
    { name: 'Commercial Ads', icon: Camera, desc: 'Premium brand commercials, food, and corporate narrative films.' },
    { name: 'Aviation & Drone', icon: Compass, desc: 'Professional aerial cinematography and drone mapping.' }
  ];

  return (
    <div className="flex flex-col w-full bg-[#111111] overflow-hidden">
      {/* 1. Cinematic Hero Section */}
      <section className="relative h-[90vh] md:h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background video stream */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#111111]/60 z-10" />
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105 filter brightness-90 saturate-[0.85]"
          >
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-photographer-taking-photos-with-his-camera-39745-large.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 w-full z-20 text-center relative flex flex-col items-center">
          <span className="text-[#D4AF37] font-sans text-xs md:text-sm uppercase tracking-[0.4em] mb-4 block animate-fade-in">
            Director of Photography & Cinematographer
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl md:text-8xl tracking-tight text-white mb-6 leading-tight max-w-4xl">
            Framing Your <span className="gold-gradient-text">Legacy</span> In Motion
          </h1>
          <p className="font-sans text-sm md:text-lg text-gray-300 max-w-2xl mb-10 leading-relaxed font-light">
            Award-winning commercial films and luxury photography production led by veteran artist Dasari Bharadwaj, backed by 16+ years of industry mastery.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Link
              href="/book"
              className="px-8 py-3.5 bg-[#D4AF37] text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-semibold hover:bg-white hover:text-[#111111] transition-all duration-300 w-full sm:w-auto text-center"
            >
              Book Production
            </Link>
            <Link
              href="/portfolio"
              className="px-8 py-3.5 border border-white/20 text-white font-sans text-xs uppercase tracking-[0.2em] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              View Work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-sans">Scroll</span>
          <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-[#D4AF37] animate-[bounce_2s_infinite]" />
          </div>
        </div>
      </section>

      {/* 2. Brand Statistics Grid */}
      <section className="py-20 border-b border-white/5 relative z-10 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {settings.stats?.map((stat: any, index: number) => (
              <div key={index} className="flex flex-col items-center text-center p-6 border border-white/5 bg-[#111111]/30">
                <span className="text-4xl md:text-5xl font-serif text-[#D4AF37] mb-2">{stat.value}</span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-sans">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Service Categories */}
      <section className="py-24 max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-3 block">Expertise</span>
          <h2 className="font-serif text-3xl md:text-5xl text-white">Production Categories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="glass-card p-10 flex flex-col gap-6 text-center items-center">
                <div className="p-4 bg-[#D4AF37]/10 rounded-full">
                  <Icon className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <h3 className="font-serif text-xl text-white">{cat.name}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{cat.desc}</p>
                <Link
                  href="/services"
                  className="font-sans text-xs uppercase tracking-[0.2em] text-[#D4AF37] hover:text-white transition-colors duration-200 mt-2 flex items-center gap-1.5"
                >
                  Explore Category <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Featured Portfolio Grid */}
      <section className="py-24 bg-[#0a0a0a] border-t border-b border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-3 block">Selected Works</span>
              <h2 className="font-serif text-3xl md:text-5xl text-white">Featured Portfolio</h2>
            </div>
            <Link
              href="/portfolio"
              className="font-sans text-xs uppercase tracking-[0.2em] text-white hover:text-[#D4AF37] border-b border-white/20 hover:border-[#D4AF37] pb-1.5 transition-all duration-300"
            >
              View Full Gallery
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPortfolio.map((item: any) => (
              <Link href={`/portfolio#${item.id}`} key={item.id} className="group relative overflow-hidden flex flex-col">
                <div className="aspect-[4/5] w-full overflow-hidden bg-[#111111] relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-60 transition-opacity duration-300" />
                  {item.videoUrl && (
                    <div className="absolute top-4 right-4 bg-[#D4AF37] p-2.5 rounded-full z-20">
                      <Play className="h-3.5 w-3.5 text-[#111111]" />
                    </div>
                  )}
                </div>
                <div className="mt-6 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-sans font-medium">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-xl text-white group-hover:text-[#D4AF37] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <span className="text-xs text-gray-500 font-sans mt-1">
                    {item.client} &bull; {item.location}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Awards Timeline */}
      <section className="py-24 max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
          <div className="lg:sticky lg:top-32">
            <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-3 block">Accolades</span>
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-6 leading-tight">National Awards & Recognition</h2>
            <p className="text-sm leading-relaxed text-gray-400">
              Acknowledged for cinematography direction, outstanding drone coverage, and high-impact commercial visual creations across major film festivals and corporate exhibitions.
            </p>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            {settings.awards?.map((award: any, idx: number) => (
              <div key={idx} className="flex gap-6 p-8 border border-white/5 bg-[#0f0f0f] hover:border-[#D4AF37]/30 transition-colors duration-300">
                <div className="p-3 bg-[#D4AF37]/10 rounded-full h-fit shrink-0">
                  <Award className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-medium font-sans mb-1">{award.year}</span>
                  <h3 className="font-serif text-lg text-white mb-1">{award.title}</h3>
                  <p className="text-xs text-gray-500 font-sans">{award.issuer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section className="py-24 bg-[#0a0a0a] border-t border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-4 block">Reviews</span>
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-12">What Clients Say</h2>
          
          <div className="flex flex-col items-center gap-8">
            <p className="font-serif text-lg md:text-2xl text-gray-200 leading-relaxed italic">
              &ldquo;{testimonials[0].content}&rdquo;
            </p>
            <div className="flex items-center gap-4 mt-4">
              <img
                src={testimonials[0].image}
                alt={testimonials[0].name}
                className="h-12 w-12 rounded-full object-cover border border-[#D4AF37]/35"
              />
              <div className="text-left flex flex-col">
                <span className="text-sm font-semibold text-white font-sans">{testimonials[0].name}</span>
                <span className="text-xs text-[#D4AF37] font-sans">{testimonials[0].role}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Latest Blog Feed */}
      <section className="py-24 max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-3 block">Insights</span>
            <h2 className="font-serif text-3xl md:text-5xl text-white">From The Studio</h2>
          </div>
          <Link
            href="/blog"
            className="font-sans text-xs uppercase tracking-[0.2em] text-white hover:text-[#D4AF37] border-b border-white/20 hover:border-[#D4AF37] pb-1.5 transition-all duration-300"
          >
            All Articles
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentBlogs.map((blog: any) => (
            <Link href={`/blog/${blog.slug}`} key={blog.id} className="group flex flex-col">
              <div className="aspect-[16/10] overflow-hidden bg-[#111111] relative">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-sans uppercase tracking-wider">
                  <span className="text-[#D4AF37] font-medium">{blog.category}</span>
                  <span>&bull;</span>
                  <span>{blog.readTime} Read</span>
                </div>
                <h3 className="font-serif text-lg text-white group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400 line-clamp-2 mt-1">
                  {blog.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Call to Action Banner */}
      <section className="py-24 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)] relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
          <h2 className="font-serif text-4xl sm:text-6xl text-white mb-6">Let's Create Something <span className="gold-gradient-text">Timeless</span></h2>
          <p className="text-sm md:text-base text-gray-300 max-w-2xl mb-10 leading-relaxed font-light">
            Whether it is a cinematic wedding film, a high-fashion brand photoshoot, or drone coverage, let our 16+ years of expertise shape your narrative.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#D4AF37] text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#111111] transition-all duration-300"
          >
            <Calendar className="h-4 w-4" /> Book Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
