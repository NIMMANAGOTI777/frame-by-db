'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Info, Calculator, ArrowRight, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Package {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isRecommended: boolean;
}

export default function PricingClient({ packages }: { packages: Package[] }) {
  // Calculator States
  const [eventDuration, setEventDuration] = useState(6); // Hours
  const [crewStrength, setCrewStrength] = useState(2); // Crew members
  const [liveStream, setLiveStream] = useState(false);
  const [albumPrinting, setAlbumPrinting] = useState(false);

  // Dynamic cost estimator
  const calculatedEstimate = (() => {
    const baseHourRate = 12000;
    const baseCrewRate = 15000;
    let total = eventDuration * baseHourRate + crewStrength * baseCrewRate;
    if (liveStream) total += 40000;
    if (albumPrinting) total += 25000;
    return total.toLocaleString('en-IN');
  })();

  const recommendedCalculatedPackage = (() => {
    if (crewStrength >= 5 || eventDuration > 12) return 'Platinum Royal';
    if (crewStrength >= 3 || eventDuration > 6) return 'Gold Luxury';
    return 'Silver Cinematic';
  })();

  return (
    <div className="flex flex-col w-full bg-[#111111] text-white py-12">
      <div className="max-w-7xl mx-auto px-6 w-full">
        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-10 border relative flex flex-col justify-between transition-all duration-500 ${
                pkg.isRecommended
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_30px_rgba(212,175,55,0.15)] scale-103'
                  : 'border-white/5 bg-[#0f0f0f] hover:border-white/15'
              }`}
            >
              {pkg.isRecommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#111111] text-[9px] uppercase tracking-[0.25em] px-4 py-1.5 font-bold">
                  Recommended Package
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-sans block mb-1">
                  Package Plan
                </span>
                <h3 className="font-serif text-2xl text-white mb-3">{pkg.name}</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed mb-6">
                  {pkg.description}
                </p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-sm font-light text-gray-400">Starts at</span>
                  <span className="text-3xl md:text-4xl font-serif text-[#D4AF37] font-semibold">
                    ₹{pkg.price}
                  </span>
                  <span className="text-xs font-light text-gray-500">/ {pkg.period}</span>
                </div>

                <div className="h-[1px] bg-white/5 w-full mb-8" />

                <ul className="flex flex-col gap-4 text-xs font-sans text-gray-300">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-light">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-12">
                <Link
                  href={`/book?package=${pkg.id}`}
                  className={`w-full py-3.5 font-sans text-xs uppercase tracking-[0.2em] font-bold block text-center transition-all duration-300 ${
                    pkg.isRecommended
                      ? 'bg-[#D4AF37] text-[#111111] hover:bg-white hover:text-[#111111]'
                      : 'border border-white/20 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                  }`}
                >
                  Book Package
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing comparison table */}
        <div className="border-t border-white/5 pt-20 mb-24 overflow-x-auto">
          <div className="text-center mb-12">
            <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-2 block font-sans">
              Compare
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-white">Compare Deliverables</h2>
          </div>
          
          <table className="w-full text-left font-sans text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-4">Features</th>
                <th className="py-4 text-[#D4AF37]">Silver Cinematic</th>
                <th className="py-4 text-[#D4AF37]">Gold Luxury</th>
                <th className="py-4 text-[#D4AF37]">Platinum Royal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300 font-light">
              <tr>
                <td className="py-4 font-medium text-white">Senior Crew Strength</td>
                <td className="py-4">2 (1 Photo + 1 Film)</td>
                <td className="py-4">4 (2 Photo + 2 Film)</td>
                <td className="py-4">6 (3 Photo + 3 Film)</td>
              </tr>
              <tr>
                <td className="py-4 font-medium text-white">Daily Shooting Coverage</td>
                <td className="py-4">Up to 6 Hours</td>
                <td className="py-4">Up to 12 Hours</td>
                <td className="py-4">Multi-day (Up to 3 Days)</td>
              </tr>
              <tr>
                <td className="py-4 font-medium text-white">Raw File Delivery</td>
                <td className="py-4">Not Included</td>
                <td className="py-4">Included (HDD format)</td>
                <td className="py-4">Included + Cloud Backup</td>
              </tr>
              <tr>
                <td className="py-4 font-medium text-white">Drone / Aerial Cinema</td>
                <td className="py-4">Extra Billed</td>
                <td className="py-4">Included (Permitted zones)</td>
                <td className="py-4">Included (Multiple flights)</td>
              </tr>
              <tr>
                <td className="py-4 font-medium text-white">Handcrafted Albums</td>
                <td className="py-4">Not Included</td>
                <td className="py-4">1 Premium Coffee Table</td>
                <td className="py-4">2 Leatherette Designers</td>
              </tr>
              <tr>
                <td className="py-4 font-medium text-white">Live Broadcast Streaming</td>
                <td className="py-4">Extra Billed</td>
                <td className="py-4">Extra Billed</td>
                <td className="py-4">Included (4K stream)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dynamic Package Calculator */}
        <div className="p-8 md:p-12 border border-[#D4AF37]/20 bg-[#0f0f0f] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Controls */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              <div>
                <span className="text-[#D4AF37] text-xs uppercase tracking-[0.2em] font-sans font-semibold mb-2 block flex items-center gap-1.5">
                  <Calculator className="h-4 w-4" /> Live Estimator
                </span>
                <h3 className="font-serif text-2xl md:text-3xl text-white">Customize Your Crew</h3>
                <p className="text-xs text-gray-400 mt-2 font-light leading-relaxed">
                  Adjust coverage hours and team size to find a cost estimate and matching production plan.
                </p>
              </div>

              {/* Slider 1: Hours */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-sans">Coverage Duration</span>
                  <span className="font-semibold text-white">{eventDuration} Hours</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="36"
                  step="2"
                  value={eventDuration}
                  onChange={(e) => setEventDuration(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] bg-white/10 h-1 cursor-pointer"
                />
              </div>

              {/* Slider 2: Crew */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-sans">Crew Members</span>
                  <span className="font-semibold text-white">{crewStrength} Professionals</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={crewStrength}
                  onChange={(e) => setCrewStrength(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] bg-white/10 h-1 cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#111111] border border-white/5 hover:border-white/10">
                  <input
                    type="checkbox"
                    checked={liveStream}
                    onChange={(e) => setLiveStream(e.target.checked)}
                    className="accent-[#D4AF37] h-4 w-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white font-sans">Add Live Broadcast</span>
                    <span className="text-[10px] text-gray-500">+ ₹40,000</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#111111] border border-white/5 hover:border-white/10">
                  <input
                    type="checkbox"
                    checked={albumPrinting}
                    onChange={(e) => setAlbumPrinting(e.target.checked)}
                    className="accent-[#D4AF37] h-4 w-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white font-sans">Add Custom Layflat Albums</span>
                    <span className="text-[10px] text-gray-500">+ ₹25,000</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Calculations Card */}
            <div className="lg:col-span-5 bg-[#111111] p-8 border border-white/10 flex flex-col justify-between h-full min-h-[300px]">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-sans font-bold">
                  Production Estimate
                </span>
                <div className="flex items-baseline gap-1 mt-2 mb-6">
                  <span className="text-xs font-light text-gray-500">Approx.</span>
                  <span className="text-3xl sm:text-4xl font-serif text-white font-bold">
                    ₹{calculatedEstimate}
                  </span>
                </div>

                <div className="h-[1px] bg-white/5 w-full mb-6" />

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] uppercase tracking-widest text-gray-500 font-sans">
                    Recommended Base Plan
                  </span>
                  <span className="text-base text-white font-serif font-medium">
                    {recommendedCalculatedPackage}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href={`/book?hours=${eventDuration}&crew=${crewStrength}&live=${liveStream}&albums=${albumPrinting}`}
                  className="w-full py-3 bg-[#D4AF37] text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-bold hover:bg-white transition-all duration-300 block text-center"
                >
                  Request Custom Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
