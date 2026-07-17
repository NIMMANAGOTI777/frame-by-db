import { readDB } from '@/lib/db';
import FAQClient from '@/features/FAQClient';

export const revalidate = 0;

export default async function FAQPage() {
  const db = await readDB();
  const { faqs } = db;

  return (
    <div className="flex flex-col w-full bg-[#111111] text-white">
      {/* Banner */}
      <section className="py-24 bg-[#0a0a0a] border-b border-white/5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col gap-4">
          <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-sans">Support Directory</span>
          <h1 className="font-serif text-4xl sm:text-6xl">Studio FAQs</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm font-light">
            Answers regarding outstation shoots, raw file releases, album prints, and live stream setups.
          </p>
        </div>
      </section>

      {/* Interactive Accordion list */}
      <FAQClient items={faqs} />
    </div>
  );
}
