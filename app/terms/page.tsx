import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="flex flex-col w-full bg-[#111111] text-white py-12">
      <div className="max-w-3xl mx-auto px-6 w-full mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Home
        </Link>

        <h1 className="font-serif text-3xl sm:text-5xl text-white mb-4">Terms & Conditions</h1>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest block border-b border-white/5 pb-6 mb-8 font-sans">
          Last Updated: July 2026
        </span>

        <article className="prose prose-invert max-w-none text-gray-300 font-sans text-sm leading-relaxed space-y-6 font-light">
          <p>
            Welcome to the official portal of <strong>Frame by DB</strong>. By accessing or using our booking platform, you agree to comply with and be bound by the following terms.
          </p>

          <h2 className="font-serif text-xl text-[#D4AF37] mt-8 mb-4">1. Booking Lock & Deposits</h2>
          <p>
            A 50% deposit and signed digital contract are required to officially lock any photography or film production date. Dates are not reserved until the transaction is successfully completed.
          </p>

          <h2 className="font-serif text-xl text-[#D4AF37] mt-8 mb-4">2. Outstation Logistics</h2>
          <p>
            For events outside Hyderabad, India, logistics including airfare, standard hotel accommodations, and local transit for the crew are to be fully covered by the client.
          </p>

          <h2 className="font-serif text-xl text-[#D4AF37] mt-8 mb-4">3. Deliverables Timeline</h2>
          <p>
            Highlight teasers are delivered within 7 to 10 days of the event. Full custom albums and graded cinematic films require significant post-production and are delivered between 6 to 8 weeks, depending on client photo selections.
          </p>

          <h2 className="font-serif text-xl text-[#D4AF37] mt-8 mb-4">4. Intellectual Property</h2>
          <p>
            Frame by DB retains the primary copyright to all raw media captured. Clients are granted a lifetime personal usage license to share, print, and distribute their event media. Commercial reproduction requires written approval from Dasari Bharadwaj.
          </p>
        </article>
      </div>
    </div>
  );
}
