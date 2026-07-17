'use client';

import { useState } from 'react';
import { Camera, Calendar, CheckCircle2, ChevronDown, ChevronUp, Mail, Phone, Clock } from 'lucide-react';

interface ServiceDetail {
  id: string;
  name: string;
  category: 'Weddings' | 'Events' | 'Commercial' | 'Specialty';
  banner: string;
  description: string;
  deliverables: string[];
  faqs: { q: string; a: string }[];
}

const servicesData: ServiceDetail[] = [
  {
    id: 'wedding-photography',
    name: 'Wedding Photography',
    category: 'Weddings',
    banner: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000',
    description: 'High-end luxury candid and traditional wedding coverage. We document every fine detail, emotion, and custom ceremony using natural light play and premium portraiture aesthetics.',
    deliverables: ['Full-day coverage by 2 Senior Photographers', '500+ High-resolution fully color-corrected photos', 'Private digital gallery access with 1 year validity', 'Candid portrait sessions of the bride & groom'],
    faqs: [
      { q: 'How many photos do we receive?', a: 'Typically between 500 to 800 high-resolution edited photos for a standard wedding.' },
      { q: 'Do you provide raw/unedited images?', a: 'Yes, we share the raw files upon request after post-production is complete.' }
    ]
  },
  {
    id: 'wedding-films',
    name: 'Wedding Films',
    category: 'Weddings',
    banner: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1000',
    description: 'Cinematic storytelling at its finest. We create emotional, movie-grade trailers and highlight films capturing the essence of your union with premium audio design and cinematic visuals.',
    deliverables: ['3-5 Minute Cinematic Trailer/Teaser', '20-30 Minute Documentary Style Highlight Film', 'Cinematic sound design and licensed music tracks', 'Shot on dual Cinema cameras (4K Log)'],
    faqs: [
      { q: 'Can we select the music for the film?', a: 'Yes, we collaborate with you to select licensing-compliant tracks that fit the emotional arc.' },
      { q: 'What cameras do you use?', a: 'We use professional Sony FX Cinema line cameras for a filmic color profile.' }
    ]
  },
  {
    id: 'pre-wedding',
    name: 'Pre Wedding Shoots',
    category: 'Weddings',
    banner: 'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=1000',
    description: 'Romantic storytelling sessions set in heritage properties, beaches, or modern city backdrops. We draft unique cinematic concepts tailored to your narrative.',
    deliverables: ['6 Hours of coverage in multiple locations', '100+ edited digital images', '1-2 Minute Pre-wedding Cinematic Teaser film', 'Wardrobe coordination and conceptual styling support'],
    faqs: [
      { q: 'Are location entry fees included?', a: 'No, entry permissions and site booking fees are to be managed by the client.' }
    ]
  },
  {
    id: 'engagement',
    name: 'Engagement Shoot',
    category: 'Weddings',
    banner: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1000',
    description: 'Documenting the milestone moment of ring exchanges, warm family greetings, and joyful portraits in high detail.',
    deliverables: ['Up to 5 hours of coverage', '150+ Hires Edited Photos', 'Fast-track delivery (10 days)', 'Online album access'],
    faqs: [
      { q: 'Can we merge this package with the wedding package?', a: 'Yes, we offer custom combo packages with special rates.' }
    ]
  },
  {
    id: 'maternity',
    name: 'Maternity Shoots',
    category: 'Specialty',
    banner: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1000',
    description: 'Graceful and elegant portraits celebrating motherhood. Our shoots are relaxed and paced comfortably in a studio or natural setting.',
    deliverables: ['3 Hours comfortable session', '40+ premium custom edited photos', 'Use of luxury maternity gowns and wraps', 'Family and partner portraits included'],
    faqs: [
      { q: 'When is the best time for a maternity shoot?', a: 'Usually during the 28th to 34th week when the belly is nicely visible and you are comfortable.' }
    ]
  },
  {
    id: 'baby-shoot',
    name: 'Baby Shoot & Portraits',
    category: 'Specialty',
    banner: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&q=80&w=1000',
    description: 'Heartwarming photography of newborn milestones, smiles, and baby setups using baby-safe lighting and props.',
    deliverables: ['Custom themed setups with props', '2-3 Hours slow-paced session', '50+ high-resolution edited images', 'Special safety-first focus'],
    faqs: [
      { q: 'How do you ensure baby comfort?', a: 'We use warm, highly-diffused flash-free natural lighting and sanitize all props before the shoot.' }
    ]
  },
  {
    id: 'birthday',
    name: 'Birthday Celebrations',
    category: 'Events',
    banner: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=1000',
    description: 'Vibrant event photography catching the smiles, cake smash, games, and family groups.',
    deliverables: ['Coverage of main party and decor', '150+ digital photos', 'Fast 7-day delivery', 'Fun group snaps'],
    faqs: [
      { q: 'Do you cover outdoor theme parks?', a: 'Yes, we cover any indoor banquet or outdoor event venue.' }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion & Editorials',
    category: 'Commercial',
    banner: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1000',
    description: 'High-concept street fashion, designer collection catalogs, and modeling portfolios capturing dynamic movement and textile textures.',
    deliverables: ['Studio or street editorial lighting setup', '30 high-end fashion retouched images', 'Creative direction and mood boarding', 'Raw files for designer portfolios'],
    faqs: [
      { q: 'Do you help with model casting?', a: 'We can recommend local model agencies and makeup artists.' }
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial Ads',
    category: 'Commercial',
    banner: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1000',
    description: 'Premium brand commercials, promo ads, and social media campaigns shot on high-resolution widescreen cinema rigs.',
    deliverables: ['Scriptwriting and storyboarding assistance', '4K Cinema grade production crew', 'Color graded with premium sound design', '30s and 60s formats for digital platforms'],
    faqs: [
      { q: 'What is the pricing model for ads?', a: 'Commercial ads are quoted based on crew strength, lighting gear, and editing scope.' }
    ]
  },
  {
    id: 'corporate',
    name: 'Corporate Coverage',
    category: 'Commercial',
    banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000',
    description: 'Professional event coverage, corporate headshots, and company profile videos highlighting infrastructure and leadership.',
    deliverables: ['Professional executive portrait sessions', 'Event highlights with keynote speeches', 'Corporate summary video (2-3 min)', 'Fast-track turnaround for immediate PR releases'],
    faqs: [
      { q: 'Can you deliver photos on the same day?', a: 'Yes, we can arrange a dedicated onsite editor for real-time social media updates.' }
    ]
  },
  {
    id: 'drone',
    name: 'Drone & Aerial Cinematography',
    category: 'Specialty',
    banner: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&q=80&w=1000',
    description: 'DGCA compliant professional drone filming for cinema, real estate, land mapping, and luxury weddings.',
    deliverables: ['4K ProRes HDR aerial reels', 'Fully licensed drone pilots', 'Safe operating procedures', 'Raw aerial files'],
    faqs: [
      { q: 'Are you licensed to fly anywhere?', a: 'We adhere to DGCA zone regulations. No-fly zones (Red zones) cannot be shot without prior military/government clearances.' }
    ]
  },
  {
    id: 'real-estate',
    name: 'Real Estate & Architectural',
    category: 'Commercial',
    banner: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1000',
    description: 'Stunning interior photography, luxury villas showcase, and construction updates using tilt-shift perspectives and HDR techniques.',
    deliverables: ['High-dynamic-range interior photography', 'Ultra-wide angle framing', 'Color correction for ambient and artificial light balance', 'Drone facade clips'],
    faqs: [
      { q: 'Should the property be staged?', a: 'Yes, staging the property beforehand ensures the best visual results.' }
    ]
  },
  {
    id: 'food',
    name: 'Food & Culinary',
    category: 'Commercial',
    banner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000',
    description: 'Appetizing macro food styling photography and slow-motion prep clips for menus, packaging, and fine-dining promotions.',
    deliverables: ['Styling and lighting of specific menu items', 'Macro lens detailing of textures', '50+ high-quality edited menu shots', 'Social reels clips of preparation'],
    faqs: [
      { q: 'Do you bring a food stylist?', a: 'We work with your food stylists or plated chefs. Custom lights and softboxes included.' }
    ]
  },
  {
    id: 'album-design',
    name: 'Premium Album Design',
    category: 'Specialty',
    banner: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1000',
    description: 'Custom handcrafted physical albums. Printed on non-tearable matte/glossy luxury layflat pages with premium leatherette or acrylic cases.',
    deliverables: ['Custom layouts designed by graphic experts', 'Premium leatherette or acrylic glass boxes', '30-40 thick layflat sheets', 'Lifelong color guarantee print'],
    faqs: [
      { q: 'How long does album delivery take?', a: 'Design is finalized within 2 weeks of photo selection. Printing and binding takes another 10 days.' }
    ]
  },
  {
    id: 'live-streaming',
    name: 'Ultra-low Latency Live Streaming',
    category: 'Specialty',
    banner: 'https://images.unsplash.com/photo-1460881680858-30d872d5b530?auto=format&fit=crop&q=80&w=1000',
    description: 'Seamless multi-cam live broadcast of weddings, corporate launches, and events in high-definition to YouTube or private pages.',
    deliverables: ['Multi-camera setup with professional audio mixing', 'Dual bonded internet connection for 100% uptime', 'Customized overlay cards and lower-thirds', 'Raw recording of the stream'],
    faqs: [
      { q: 'Do you require local power and internet?', a: 'We bring our own cellular bonding routers (dual network) but require standard power supplies at the venue.' }
    ]
  }
];

export default function ServicesClient() {
  const [activeService, setActiveService] = useState<ServiceDetail>(servicesData[0]);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eventType: activeService.name,
          location: 'Inquiry via Services Page',
          budget: 'TBD'
        })
      });

      if (res.ok) {
        setFormStatus('success');
        setFormData({ name: '', email: '', phone: '', date: '', message: '' });
      } else {
        setFormStatus('error');
      }
    } catch {
      setFormStatus('error');
    }
  };

  return (
    <section className="py-20 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
      {/* Service Sidebar Selector */}
      <div className="lg:col-span-4 flex flex-col gap-2 max-h-[80vh] overflow-y-auto pr-2 border-r border-white/5">
        <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-3 px-3 font-semibold font-sans">Service Catalogue</span>
        {servicesData.map((service) => {
          const isActive = activeService.id === service.id;
          return (
            <button
              key={service.id}
              onClick={() => {
                setActiveService(service);
                setOpenFAQIndex(null);
                setFormStatus('idle');
              }}
              className={`w-full text-left px-4 py-3 text-sm font-sans uppercase tracking-[0.1em] border-l-2 transition-all duration-300 ${
                isActive
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {service.name}
            </button>
          );
        })}
      </div>

      {/* Service Details View */}
      <div className="lg:col-span-8 flex flex-col gap-10">
        {/* Hero Banner */}
        <div className="w-full aspect-[21/9] overflow-hidden bg-zinc-900 border border-white/5 relative">
          <img
            src={activeService.banner}
            alt={activeService.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-85" />
          <div className="absolute bottom-6 left-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold bg-[#111111]/80 backdrop-blur-sm px-3 py-1 border border-white/5 mb-2.5 inline-block font-sans">
              {activeService.category}
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl text-white">{activeService.name}</h2>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-4">
          <h3 className="font-serif text-xl text-[#D4AF37]">Description</h3>
          <p className="text-sm leading-relaxed text-gray-300 font-light font-sans">{activeService.description}</p>
        </div>

        {/* Deliverables */}
        <div className="flex flex-col gap-4">
          <h3 className="font-serif text-xl text-[#D4AF37]">Package Deliverables</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeService.deliverables.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-[#0f0f0f] border border-white/5">
                <CheckCircle2 className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300 font-light leading-relaxed font-sans">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="flex flex-col gap-4">
          <h3 className="font-serif text-xl text-[#D4AF37]">Frequently Asked Questions</h3>
          <div className="flex flex-col gap-3">
            {activeService.faqs.map((faq, idx) => {
              const isOpen = openFAQIndex === idx;
              return (
                <div key={idx} className="border border-white/5 bg-[#0f0f0f] overflow-hidden">
                  <button
                    onClick={() => setOpenFAQIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-sans"
                  >
                    <span className="font-medium text-white">{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-[#D4AF37]" /> : <ChevronDown className="h-4 w-4 text-[#D4AF37]" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-xs text-gray-400 font-light leading-relaxed border-t border-white/5 pt-3 font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="p-8 border border-[#D4AF37]/20 bg-[#0f0f0f] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl" />
          <h3 className="font-serif text-xl text-white mb-2 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#D4AF37]" /> Inquiry for {activeService.name}
          </h3>
          <p className="text-xs text-gray-400 mb-6 font-light font-sans">
            Submit your details and Bharadwaj's team will contact you with availability and a custom quote.
          </p>

          <form onSubmit={handleInquirySubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="service-inquiry-name" className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Full Name</label>
              <input
                id="service-inquiry-name"
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-[#111111] border border-white/10 px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37] transition-colors font-sans text-white"
                autoComplete="name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="service-inquiry-phone" className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Phone Number</label>
              <input
                id="service-inquiry-phone"
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="bg-[#111111] border border-white/10 px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37] transition-colors font-sans text-white"
                autoComplete="tel"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="service-inquiry-email" className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Email Address</label>
              <input
                id="service-inquiry-email"
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-[#111111] border border-white/10 px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37] transition-colors font-sans text-white"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="service-inquiry-date" className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Event Date</label>
              <input
                id="service-inquiry-date"
                type="date"
                required
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="bg-[#111111] border border-white/10 px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37] transition-colors text-white font-sans"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="service-inquiry-msg" className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Project details / Requirements</label>
              <textarea
                id="service-inquiry-msg"
                rows={4}
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Share details like shooting duration, locations, and special deliverables..."
                className="bg-[#111111] border border-white/10 px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37] transition-colors resize-none font-sans text-white"
              />
            </div>

            <div className="sm:col-span-2 mt-2">
              <button
                type="submit"
                disabled={formStatus === 'loading'}
                className="w-full py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300"
              >
                {formStatus === 'loading' ? 'Sending Inquiry...' : 'Submit Service Inquiry'}
              </button>
              {formStatus === 'success' && (
                <p className="text-[11px] text-[#D4AF37] mt-3 text-center font-sans">Inquiry submitted successfully! We will contact you soon.</p>
              )}
              {formStatus === 'error' && (
                <p className="text-[11px] text-red-400 mt-3 text-center font-sans">Submission failed. Please check input parameters or try again.</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
