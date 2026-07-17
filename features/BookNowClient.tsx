'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, User, Phone, Mail, MapPin, DollarSign, MessageSquare, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

function BookingFormContent() {
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    eventType: 'Wedding Photography & Films',
    location: '',
    budget: '',
    message: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const pkg = searchParams.get('package');
    const hours = searchParams.get('hours');
    const crew = searchParams.get('crew');
    const live = searchParams.get('live') === 'true';
    const albums = searchParams.get('albums') === 'true';

    let eventVal = 'Wedding Photography & Films';
    let budgetVal = '';
    let messageVal = '';

    if (pkg === 'p1') {
      eventVal = 'Silver Cinematic';
      budgetVal = '1,50,000 INR';
    } else if (pkg === 'p2') {
      eventVal = 'Gold Luxury';
      budgetVal = '3,50,000 INR';
    } else if (pkg === 'p3') {
      eventVal = 'Platinum Royal';
      budgetVal = '6,00,000 INR';
    }

    if (hours || crew) {
      eventVal = 'Custom Production Package';
      messageVal = `Custom requested configuration: ${hours ? `${hours} Hours, ` : ''}${crew ? `${crew} Crew members` : ''}.${live ? ' Includes Live Stream.' : ''}${albums ? ' Includes Custom Albums.' : ''}`;
    }

    setFormData((prev) => ({
      ...prev,
      eventType: eventVal,
      budget: budgetVal,
      message: messageVal || prev.message
    }));
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setStatus('success');
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#ffffff', '#111111']
        });
      } else {
        setStatus('error');
        if (data.errors && Array.isArray(data.errors)) {
          const detail = data.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
          setErrorMessage(detail || data.message || 'Submission failed. Please check inputs.');
        } else {
          setErrorMessage(data.message || 'Submission failed. Please check inputs or try again.');
        }
      }
    } catch {
      setStatus('error');
      setErrorMessage('Server connection error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto p-10 border border-[#D4AF37] bg-[#D4AF37]/5 text-center flex flex-col items-center gap-6 my-12">
        <div className="p-4 bg-[#D4AF37]/10 rounded-full text-[#D4AF37] mb-2">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="font-serif text-3xl text-white">Booking Requested!</h2>
        <p className="text-sm text-gray-300 leading-relaxed font-light font-sans">
          Thank you. Your booking request has been securely logged in our database. Our production coordinator will review Bharadwaj's schedule and reach out to you within 24 hours.
        </p>
        <div className="h-[1px] bg-white/5 w-full my-4" />
        <div className="text-left w-full text-xs text-gray-400 flex flex-col gap-2 font-sans">
          <p><strong>Name:</strong> {formData.name}</p>
          <p><strong>Event:</strong> {formData.eventType}</p>
          <p><strong>Proposed Date:</strong> {formData.date}</p>
        </div>
        <Link
          href="/"
          className="mt-6 px-8 py-3 bg-[#D4AF37] text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#111111] transition-all duration-300"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start my-12">
      {/* Sidebar explanation */}
      <div className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-32 font-sans text-xs text-gray-400">
        <div>
          <h2 className="font-serif text-2xl text-white mb-2">Secure Your Date</h2>
          <p className="font-light leading-relaxed">
            Dasari Bharadwaj accepts only a limited number of high-end wedding and commercial projects each year to guarantee visual focus and premium post-production.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 border-l-2 border-[#D4AF37]/35 pl-6 font-light">
          <p><strong>Step 1:</strong> Submit the booking reservation form.</p>
          <p><strong>Step 2:</strong> 1-on-1 virtual call to finalize coordinates and timelines.</p>
          <p><strong>Step 3:</strong> Contract release and 50% booking advance lock.</p>
        </div>

        <div className="p-6 bg-[#0a0a0a] border border-white/5">
          <span className="text-[#D4AF37] font-semibold block mb-1">Important Notice</span>
          <p className="leading-relaxed font-light">
            Dates during premium winter wedding seasons (October to February) book out up to 8 months in advance.
          </p>
        </div>
      </div>

      {/* Main Booking Form */}
      <div className="lg:col-span-8 p-8 md:p-12 border border-white/5 bg-[#0f0f0f] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl" />
        <h3 className="font-serif text-xl text-white mb-2 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#D4AF37]" /> Reserve Production Date
        </h3>
        <p className="text-xs text-gray-400 mb-8 font-light font-sans">
          Fill out all necessary details to initialize the scheduling query.
        </p>

        <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans text-xs">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-form-name" className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#D4AF37]" /> Full Name
            </label>
            <input
              id="book-form-name"
              type="text"
              required
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none"
              autoComplete="name"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-form-phone" className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#D4AF37]" /> Phone Number
            </label>
            <input
              id="book-form-phone"
              type="tel"
              required
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none"
              autoComplete="tel"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-form-email" className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#D4AF37]" /> Email Address
            </label>
            <input
              id="book-form-email"
              type="email"
              required
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none"
              autoComplete="email"
            />
          </div>

          {/* Event Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-form-date" className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" /> Proposed Event Date
            </label>
            <input
              id="book-form-date"
              type="date"
              required
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none text-white"
            />
          </div>

          {/* Event Type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-form-type" className="text-[10px] uppercase tracking-widest text-gray-500">Event Type</label>
            <select
              id="book-form-type"
              name="eventType"
              value={formData.eventType}
              onChange={handleInputChange}
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none cursor-pointer"
            >
              <option value="Wedding Photography & Films">Wedding Photography & Films</option>
              <option value="Commercial Advertisement">Commercial Advertisement</option>
              <option value="Corporate Event / Headshots">Corporate Event / Headshots</option>
              <option value="Pre Wedding / Couples Session">Pre Wedding / Couples Session</option>
              <option value="Drone Cinematography / Mapping">Drone Cinematography / Mapping</option>
              <option value="Maternity & Newborn shoot">Maternity & Newborn shoot</option>
              <option value="Custom Production Package">Custom Production Package</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-form-loc" className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" /> Event Location
            </label>
            <input
              id="book-form-loc"
              type="text"
              required
              name="location"
              placeholder="e.g. Hyderabad, Falaknuma Palace"
              value={formData.location}
              onChange={handleInputChange}
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none"
            />
          </div>

          {/* Budget */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="book-form-budget" className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-[#D4AF37]" /> Allocated Budget (INR)
            </label>
            <input
              id="book-form-budget"
              type="text"
              name="budget"
              placeholder="e.g. ₹3,50,000"
              value={formData.budget}
              onChange={handleInputChange}
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none"
            />
          </div>

          {/* Message */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="book-form-msg" className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[#D4AF37]" /> Add Brief / Details
            </label>
            <textarea
              id="book-form-msg"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Tell us about the schedule, flow, or any special production details..."
              className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all resize-none rounded-none"
            />
          </div>

          {/* Submit */}
          <div className="sm:col-span-2 mt-4">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-[#D4AF37] hover:bg-white text-[#111111] font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 rounded-none"
            >
              {status === 'loading' ? 'Submitting Reservation...' : 'Confirm Reservation'}
            </button>
            {status === 'error' && (
              <p className="text-[11px] text-red-400 mt-4 text-center">
                {errorMessage || 'Submission failed. Please check inputs or try again.'}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BookNowClient() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-gray-500 font-sans">Loading form dependencies...</div>}>
      <BookingFormContent />
    </Suspense>
  );
}
