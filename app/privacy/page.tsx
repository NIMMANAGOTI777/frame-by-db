import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Frame by DB',
  description: 'Learn how Frame by DB collects, handles, and protects your personal information.',
};

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col w-full bg-[#111111] text-white py-12">
      <div className="max-w-3xl mx-auto px-6 w-full mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Home
        </Link>

        <h1 className="font-serif text-3xl sm:text-5xl text-white mb-4">Privacy Policy</h1>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest block border-b border-white/5 pb-6 mb-8 font-sans">
          Last Updated: July 2026
        </span>

        <article className="prose prose-invert max-w-none text-gray-300 font-sans text-sm leading-relaxed space-y-6 font-light">
          <p>
            At <strong>Frame by DB</strong>, managed by Dasari Bharadwaj, we respect your privacy and are committed to protecting the personal data you share with us during inquiries, bookings, and collaborations.
          </p>
          
          <h2 className="font-serif text-xl text-[#D4AF37] mt-8 mb-4">1. Information We Collect</h2>
          <p>
            When you interact with our website, request bookings, or submit contact forms, we collect details like your full name, email address, phone number, event dates, event locations, and projected budgets.
          </p>

          <h2 className="font-serif text-xl text-[#D4AF37] mt-8 mb-4">2. How We Use Your Data</h2>
          <p>
            Your details are used strictly to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process your photography and film booking requests.</li>
            <li>Coordinate logistics and schedule consultations.</li>
            <li>Send newsletters or project updates (if explicitly subscribed).</li>
            <li>Maintain historical project records inside our secure CMS.</li>
          </ul>

          <h2 className="font-serif text-xl text-[#D4AF37] mt-8 mb-4">3. Data Sharing</h2>
          <p>
            We do not sell, rent, or lease your private data to third-party marketing companies. Personal data is shared only with core crew members assisting with your production, or when legally compelled by Indian judicial regulations.
          </p>

          <h2 className="font-serif text-xl text-[#D4AF37] mt-8 mb-4">4. Media and Copyright</h2>
          <p>
            By booking a production, you agree that selected highlight images and cinematic films may be displayed on our portfolio, gallery, or official social channels for marketing purposes. If you require private, non-disclosed coverage, a non-disclosure agreement (NDA) option is available during the contract stage.
          </p>
        </article>
      </div>
    </div>
  );
}
