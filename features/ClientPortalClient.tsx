'use client';

import { useState } from 'react';
import { Lock, Download, Calendar, MapPin, User, Check } from 'lucide-react';

export default function ClientPortalClient() {
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [activeProject, setActiveProject] = useState<any | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-configured mock access keys for demo
    if (accessKey.trim().toUpperCase() === 'ANANYA-2026') {
      setActiveProject({
        title: 'Karthik & Sneha Wedding Archive',
        clientName: 'Karthik & Sneha',
        date: 'October 12, 2026',
        location: 'Taj Falaknuma, Hyderabad',
        status: 'post-production',
        timeline: [
          { label: 'Footage Capture & Backup', status: 'completed', date: 'Oct 15, 2026' },
          { label: 'Candid Photos Post-Processing', status: 'completed', date: 'Nov 02, 2026' },
          { label: 'Cinematic Trailer Editing', status: 'completed', date: 'Nov 12, 2026' },
          { label: 'Color Grading & Audio Master', status: 'active', date: 'Est. Nov 25, 2026' },
          { label: 'Designer Album Print & Bind', status: 'pending', date: 'Est. Dec 05, 2026' }
        ],
        albumPhotos: [
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1550005814-7243baa2e7b8?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=300'
        ],
        downloads: [
          { label: 'High-Resolution Edited Photo Stills (.ZIP)', size: '4.8 GB' },
          { label: 'Cinematic Wedding Trailer (4K ProRes .MP4)', size: '1.2 GB' }
        ],
        invoice: {
          number: 'INV-2026-089',
          total: '₹3,50,000',
          status: 'Paid (100% Cleared)'
        }
      });
    } else {
      setError('Invalid event access key. Try "ANANYA-2026".');
    }
  };

  const handleLogout = () => {
    setActiveProject(null);
    setAccessKey('');
  };

  if (!activeProject) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#111111] px-6 py-12 relative">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        <div className="max-w-md w-full bg-[#0a0a0a] border border-[#D4AF37]/20 p-8 md:p-10 relative z-10 flex flex-col items-center">
          <div className="p-3.5 bg-[#D4AF37]/10 rounded-full text-[#D4AF37] mb-6">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl text-white mb-2">Client Portal</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center mb-8 font-sans">
            Access Private Albums & Timelines
          </p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5 font-sans text-xs">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="portal-key-input" className="text-[9px] uppercase tracking-widest text-gray-400">Event Access Key</label>
              <input
                id="portal-key-input"
                type="text"
                required
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="e.g. ANANYA-2026"
                className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none text-center tracking-widest uppercase"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[10px] mt-1 text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 rounded-none mt-2"
            >
              Verify Event Key
            </button>
          </form>

          <div className="mt-8 text-center text-[10px] text-gray-500">
            <p>Type <strong>ANANYA-2026</strong> for a demo preview.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 mt-4">
      {/* Header summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-sans font-semibold mb-2 block">
            Private Client Space
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-white">
            {activeProject.title}
          </h2>
          <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 uppercase font-sans mt-3">
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {activeProject.clientName}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {activeProject.date}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {activeProject.location}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-6 py-2 border border-white/10 hover:border-red-500/20 text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all text-xs font-sans uppercase tracking-widest rounded-none"
        >
          Exit Gallery
        </button>
      </div>

      {/* Portal Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Timeline & Billing */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Timeline progress card */}
          <div className="p-8 border border-white/5 bg-[#0a0a0a]">
            <h3 className="font-serif text-lg text-white mb-6">Project Status Timeline</h3>
            <div className="flex flex-col gap-6">
              {activeProject.timeline.map((step: any, idx: number) => (
                <div key={idx} className="flex gap-4 relative">
                  {idx < activeProject.timeline.length - 1 && (
                    <div className="absolute left-2.5 top-6 w-[1px] h-10 bg-white/10" />
                  )}

                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 z-10 ${
                    step.status === 'completed' ? 'border-green-500 bg-green-500/10 text-green-400' :
                    step.status === 'active' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] animate-pulse' : 'border-white/10 text-gray-600'
                  }`}>
                    {step.status === 'completed' && <Check className="h-3 w-3" />}
                  </div>

                  <div className="flex flex-col">
                    <span className={`text-xs font-sans font-medium ${step.status === 'completed' ? 'text-white' : step.status === 'active' ? 'text-[#D4AF37]' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                    <span className="text-[9px] text-gray-600 font-sans mt-0.5">{step.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoicing summary */}
          <div className="p-8 border border-white/5 bg-[#0a0a0a] flex flex-col gap-4 font-sans text-xs">
            <h3 className="font-serif text-lg text-white">Billing & Invoices</h3>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-gray-500">Invoice Number</span>
              <span className="font-semibold text-white">{activeProject.invoice.number}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-gray-500">Total Billed</span>
              <span className="font-semibold text-white">{activeProject.invoice.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Payment Status</span>
              <span className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 font-semibold uppercase tracking-wider text-[9px]">
                {activeProject.invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Protected Albums & Video Downloads */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          {/* Gallery Stills */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-xl text-[#D4AF37]">Private Proofs Gallery</h3>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Below are selected candid proofs from your wedding coverage. Use the full zip links below to download high-resolution masters.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
              {activeProject.albumPhotos.map((photo: string, idx: number) => (
                <div key={idx} className="aspect-square bg-zinc-900 border border-white/5 overflow-hidden">
                  <img
                    src={photo}
                    alt={`Client wedding proof ${idx}`}
                    className="w-full h-full object-cover hover:scale-103 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Video & Photo Downloads */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-xl text-[#D4AF37]">Master Downloads</h3>
            <div className="flex flex-col gap-3">
              {activeProject.downloads.map((dl: any, idx: number) => (
                <div key={idx} className="p-5 border border-white/5 bg-[#0a0a0a] flex items-center justify-between gap-4 font-sans text-xs">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
                      <Download className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">{dl.label}</span>
                      <span className="text-[10px] text-gray-500">File size: {dl.size}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert(`Downloading ${dl.label}...`)}
                    className="px-4 py-2 border border-[#D4AF37]/30 hover:border-[#D4AF37] text-gray-400 hover:text-white transition-colors uppercase tracking-wider text-[10px] rounded-none shrink-0"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
