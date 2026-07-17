import type { Metadata } from 'next';
import ClientPortalClient from '@/features/ClientPortalClient';

export const metadata: Metadata = {
  title: 'Client Portal | Frame by DB',
  description: 'Access your private wedding photos, corporate brand videos, project timeline status, billing statements, and download master high-resolution assets.',
};

export default function ClientPortalPage() {
  return (
    <div className="flex flex-col w-full bg-[#111111] text-white">
      {/* Banner */}
      <section className="py-24 bg-[#0a0a0a] border-b border-white/5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col gap-4">
          <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-sans">Client Portal</span>
          <h1 className="font-serif text-4xl sm:text-6xl">Secure Client Portal</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm font-light">
            Enter your private access key to access custom deliverables, download high-resolution masters, and review production progress.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 w-full py-12">
        <ClientPortalClient />
      </section>
    </div>
  );
}
