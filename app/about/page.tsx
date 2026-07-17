import Link from 'next/link';
import { readDB } from '@/lib/db';
import { Award, Camera, Video, Compass, Cpu } from 'lucide-react';

export const revalidate = 0;

export default async function About() {
  const db = await readDB();
  const { settings } = db;

  // Timeline events representing Bharadwaj's 16+ years path
  const timeline = [
    { year: '2010', title: 'Foundations & Film Roots', desc: 'Started in visual editing and camera assistance in regional South Indian film sets, learning classic lighting rules.' },
    { year: '2014', title: 'Independent DoP Debut', desc: 'Transitioned to independent cinematography directing music videos, local brand ads, and high-fashion collections.' },
    { year: '2018', title: 'Frame by DB Incorporation', desc: 'Founded Frame by DB in Hyderabad, focusing on premium luxury wedding filmmaking and corporate storytelling.' },
    { year: '2022', title: 'National Level Acclaim', desc: 'Won Top Cinematography awards and expanded services to drone aviation mapping and high-end live streams.' },
    { year: '2026', title: 'The 16+ Year Legacy', desc: 'Directing a full team of creative visual artists executing international weddings, commercials, and government features.' }
  ];

  // Camera gear setup
  const gear = [
    { category: 'Cinema Cameras', items: ['Sony FX6 Cinema Line', 'Sony FX3 Cinema Line', 'RED Komodo 6K (Project-based)'] },
    { category: 'Lenses', items: ['DZOFilm Vespid Prime Cine Lens Set', 'Sony GM Prime Lenses (24mm, 50mm, 85mm)', 'Tamron High-Speed Zoom Lenses'] },
    { category: 'Drone & Aerial', items: ['DJI Mavic 3 Pro Cine (ProRes support)', 'Custom FPV Acro Drone (High-speed chases)'] },
    { category: 'Stabilization & Lights', items: ['DJI Ronin RS3 Pro Gimbal', 'Aputure Light Storm Set (600d, 300d)', 'Amaran Flexible LED Panels'] }
  ];

  return (
    <div className="flex flex-col w-full bg-[#111111] text-white">
      {/* Hero Header */}
      <section className="py-24 bg-[#0a0a0a] border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col gap-4 text-center">
          <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-sans">The Artist Behind the Lens</span>
          <h1 className="font-serif text-4xl sm:text-6xl text-white">Dasari Bharadwaj</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base font-light">
            A journey of 16+ years capturing light, frames, shadows, and human legacies in motion.
          </p>
        </div>
      </section>

      {/* Founder Story & Philosophy */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="aspect-[4/5] bg-zinc-900 overflow-hidden relative border border-white/10">
          <img
            src={settings.founderImage || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800"}
            alt="Dasari Bharadwaj portrait"
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute bottom-6 left-6 bg-[#111111]/90 backdrop-blur-md px-6 py-4 border border-[#D4AF37]/20 flex flex-col">
            <span className="text-[#D4AF37] text-2xl font-serif">16+</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">Years of Directorship</span>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <span className="text-[#D4AF37] text-xs uppercase tracking-[0.2em] font-sans mb-2 block">My Philosophy</span>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">Capturing the Invisible Emotion</h2>
            <p className="text-sm leading-relaxed text-gray-400 font-light">
              I believe that cinematography is not just about cameras, resolutions, or expensive lenses. It is the physics of light meeting the geometry of human feeling. Over the last 16 years, my mission has been to craft images that resonate long after the screen goes dark.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl text-[#D4AF37] mb-2">Shadows Over Brightness</h3>
            <p className="text-sm leading-relaxed text-gray-400 font-light">
              In a world obsessed with over-illuminated scenes, I find beauty in the shadows. Controlling contrast, utilizing backlighting, and catching organic, unscripted glances are the pillars of the Frame by DB aesthetic.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 mt-2">
            <Link
              href="/contact"
              className="px-8 py-3 bg-[#D4AF37] text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-semibold hover:bg-white transition-all duration-300 text-center"
            >
              Contact Founder
            </Link>
          </div>
        </div>
      </section>

      {/* Experience Timeline */}
      <section className="py-24 bg-[#0a0a0a] border-t border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-3 block">Evolution</span>
            <h2 className="font-serif text-3xl md:text-5xl text-white">Experience Timeline</h2>
          </div>

          <div className="relative border-l border-white/10 max-w-3xl mx-auto pl-8 flex flex-col gap-12">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Gold timeline node */}
                <div className="absolute -left-[41px] top-1.5 h-6 w-6 rounded-full bg-[#111111] border-2 border-white/15 group-hover:border-[#D4AF37] transition-colors duration-300 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white/20 group-hover:bg-[#D4AF37] transition-colors duration-300" />
                </div>
                
                <span className="text-[#D4AF37] text-xl font-serif mb-1 block">{item.year}</span>
                <h3 className="text-lg text-white font-serif mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Behind the Camera - Gear Showcase */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-3 block">Behind the Camera</span>
          <h2 className="font-serif text-3xl md:text-5xl text-white">The Creative Toolkit</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {gear.map((cat, idx) => (
            <div key={idx} className="p-8 border border-white/5 bg-[#0f0f0f] flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#D4AF37]/10 rounded-full">
                  {idx === 0 && <Video className="h-5 w-5 text-[#D4AF37]" />}
                  {idx === 1 && <Camera className="h-5 w-5 text-[#D4AF37]" />}
                  {idx === 2 && <Compass className="h-5 w-5 text-[#D4AF37]" />}
                  {idx === 3 && <Cpu className="h-5 w-5 text-[#D4AF37]" />}
                </div>
                <h3 className="font-serif text-base text-white">{cat.category}</h3>
              </div>
              <ul className="flex flex-col gap-3 text-xs text-gray-400 font-sans">
                {cat.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
