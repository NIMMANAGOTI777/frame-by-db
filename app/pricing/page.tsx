import { readDB } from '@/lib/db';
import PricingClient from '@/features/PricingClient';

export const revalidate = 0;

export default async function PricingPage() {
  const db = await readDB();
  const { pricing } = db;

  return (
    <div className="flex flex-col w-full bg-[#111111] text-white">
      {/* Banner */}
      <section className="py-24 bg-[#0a0a0a] border-b border-white/5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col gap-4">
          <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-sans">Investment Plans</span>
          <h1 className="font-serif text-4xl sm:text-6xl">Bespoke Pricing</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm font-light">
            Clear investment parameters tailored for weddings, corporate media releases, commercial ads, and bespoke collections.
          </p>
        </div>
      </section>

      {/* Interactive Pricing Details */}
      <PricingClient packages={pricing} />
    </div>
  );
}
