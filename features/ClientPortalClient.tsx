'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Lock, Download, Calendar, MapPin, User, Check, LayoutDashboard, 
  FileText, CreditCard, Image as ImageIcon, LifeBuoy, DollarSign, 
  Clock, ArrowRight, Printer, Share2, Copy, ExternalLink, Send, 
  CheckCircle2, X, ChevronRight, Info
} from 'lucide-react';

export default function ClientPortalClient() {
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [client, setClient] = useState<any | null>(null);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'bookings' | 'quotations' | 'invoices' | 'payments' | 'gallery' | 'downloads' | 'profile' | 'support'
  >('dashboard');
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<any | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [viewInvoiceDetails, setViewInvoiceDetails] = useState<any | null>(null);
  const [receiptModalPayment, setReceiptModalPayment] = useState<any | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>({});
  
  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Support State
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Clipboard notify
  const [copiedInvoiceNumber, setCopiedInvoiceNumber] = useState<string | null>(null);

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/client/auth');
        const data = await res.json();
        
        // Also load global settings for bank/UPI info
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSiteSettings(settingsData);
        }

        if (data.isLoggedIn && data.client) {
          setClient(data.client);
          await loadDashboard(data.client.id);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const loadDashboard = async (clientId: string) => {
    try {
      const res = await fetch('/api/client/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        
        // Initialize profile form
        if (data.bookings && data.bookings[0]) {
          const booking = data.bookings[0];
          setProfileName(data.client?.name || booking.name);
          setProfilePhone(data.client?.phone || booking.phone);
        } else {
          setProfileName(data.client?.name || '');
          setProfilePhone(data.client?.phone || '');
        }
        setProfileCompany(data.client?.companyName || '');
        setProfileAddress(data.client?.billingAddress || '');
      }
    } catch (err) {
      console.error('Failed to load client dashboard:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/client/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setClient(data.client);
        await loadDashboard(data.client.id);
      } else {
        setError(data.error || 'Invalid event access key.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/client/auth', { method: 'DELETE' });
      setClient(null);
      setDashboardData(null);
      setAccessKey('');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveSuccess(false);
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          companyName: profileCompany,
          billingAddress: profileAddress
        })
      });
      if (res.ok) {
        setProfileSaveSuccess(true);
        // Refresh client object
        const clientRes = await fetch('/api/client/auth');
        const clientData = await clientRes.ok ? await clientRes.json() : null;
        if (clientData?.isLoggedIn) {
          setClient(clientData.client);
        }
        setTimeout(() => setProfileSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSuccess(true);
    setSupportMessage('');
    setTimeout(() => setSupportSuccess(false), 4000);
  };

  const handlePayInvoice = async (invoiceId: string, amount: number) => {
    setPaymentLoading(true);
    try {
      const res = await fetch('/api/client/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount,
          paymentMethod: 'UPI / QR Scan',
          transactionId: `TXN_UPI_${Date.now()}`
        })
      });
      if (res.ok) {
        setPaymentModalInvoice(null);
        await loadDashboard(client.id);
        alert('Payment Recorded Successfully! The invoice balance has been updated.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCopyLink = (inv: any) => {
    const link = `${window.location.origin}/invoices/${inv.invoiceNumber}.pdf`;
    navigator.clipboard.writeText(link);
    setCopiedInvoiceNumber(inv.invoiceNumber);
    setTimeout(() => setCopiedInvoiceNumber(null), 3000);
  };

  const handleWhatsAppShare = (inv: any) => {
    const text = `Hi, here is my invoice ${inv.invoiceNumber} for Frame by DB. Total: ₹${inv.total.toLocaleString('en-IN')}. Link: ${window.location.origin}/invoices/${inv.invoiceNumber}.pdf`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const triggerPrint = (invoiceId: string) => {
    // We can open the PDF in a new window and call print, or print the modal content
    const printWindow = window.open(`/invoices/${invoiceId}.pdf`, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-gray-500 uppercase tracking-widest font-sans bg-[#111111] text-white">
        Verifying client portal connection...
      </div>
    );
  }

  // LOGIN SCREEN
  if (!client || !dashboardData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#111111] px-6 py-12 relative">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        <div className="max-w-md w-full bg-[#0a0a0a] border border-[#D4AF37]/20 p-8 md:p-10 relative z-10 flex flex-col items-center">
          <div className="p-3.5 bg-[#D4AF37]/10 rounded-full text-[#D4AF37] mb-6">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl text-white mb-2">Client Portal</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center mb-8 font-sans">
            Access Private Albums, Invoices & Timelines
          </p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5 font-sans text-xs">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="portal-key-input" className="text-[9px] uppercase tracking-widest text-gray-400">Event Access Key</label>
              <input
                id="portal-key-input"
                name="accessKey"
                type="text"
                required
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="e.g. ANANYA-2026"
                className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none text-center tracking-widest uppercase font-semibold"
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[10px] mt-1 text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 rounded-none mt-2"
            >
              {loginLoading ? 'Verifying...' : 'Verify Access Key'}
            </button>
          </form>

          <div className="mt-8 text-center text-[10px] text-gray-500">
            <p>Type <strong>ANANYA-2026</strong> for a demo preview.</p>
          </div>
        </div>
      </div>
    );
  }

  const { stats, recentInvoices, recentPayments, downloads, albumPhotos, timeline, bookings } = dashboardData;

  // LAYOUT WITH SIDEBAR
  return (
    <div className="flex flex-col lg:flex-row min-h-[70vh] bg-[#0c0c0c] border border-white/5 font-sans text-xs text-white">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#070707] border-b lg:border-b-0 lg:border-r border-white/5 py-8 px-6 shrink-0 flex flex-col justify-between">
        <div className="flex flex-col gap-8">
          {/* Client Welcome Banner */}
          <div className="flex items-center gap-3 pb-6 border-b border-white/5">
            <div className="h-9 w-9 bg-[#D4AF37]/15 rounded-full flex items-center justify-center text-[#D4AF37] font-serif text-base font-bold shrink-0">
              {client.name.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-xs font-semibold text-white truncate">{client.name}</span>
              <span className="text-[8px] text-gray-500 uppercase tracking-widest truncate">{client.email}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'dashboard' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-[#D4AF37]" /> Dashboard
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'bookings' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" /> My Bookings
            </button>

            <button
              onClick={() => setActiveTab('quotations')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'quotations' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Info className="h-3.5 w-3.5 text-[#D4AF37]" /> Quotations
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'invoices' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-[#D4AF37]" /> Invoices
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'payments' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 text-[#D4AF37]" /> Payments
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'gallery' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5 text-[#D4AF37]" /> Gallery Proofs
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'downloads' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Download className="h-3.5 w-3.5 text-[#D4AF37]" /> Downloads
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'profile' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5 text-[#D4AF37]" /> Profile
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'support' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <LifeBuoy className="h-3.5 w-3.5 text-[#D4AF37]" /> Support
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 transition-all text-[10px] uppercase tracking-widest mt-12"
        >
          Exit Client Portal
        </button>
      </aside>

      {/* Main Panel Window */}
      <main className="flex-1 p-6 md:p-8 bg-[#0a0a0a] min-w-0">
        
        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="font-serif text-2xl text-white">Client Console Dashboard</h2>
              <p className="text-gray-400 mt-1">Operational updates, billing summary, and deliverables.</p>
            </div>

            {/* Quick Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-5 bg-[#0e0e0e] border border-white/5 flex flex-col gap-2">
                <Calendar className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-sans font-medium">Total Bookings</span>
                <span className="text-lg font-serif text-white font-semibold">{stats.totalBookings}</span>
              </div>

              <div className="p-5 bg-[#0e0e0e] border border-white/5 flex flex-col gap-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-sans font-medium">Total Paid</span>
                <span className="text-lg font-serif text-white font-semibold">₹{stats.totalPaid.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-5 bg-[#0e0e0e] border border-white/5 flex flex-col gap-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-sans font-medium">Pending Due</span>
                <span className="text-lg font-serif text-white font-semibold">₹{stats.pendingBalance.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-5 bg-[#0e0e0e] border border-white/5 flex flex-col gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-sans font-medium">Active Shoots</span>
                <span className="text-lg font-serif text-white font-semibold">{stats.activeProjects}</span>
              </div>

              <div className="p-5 bg-[#0e0e0e] border border-white/5 flex flex-col gap-2">
                <Download className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-sans font-medium">Downloads</span>
                <span className="text-lg font-serif text-white font-semibold">{stats.availableDownloadsCount}</span>
              </div>
            </div>

            {/* Core Body Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2">
              
              {/* Left Column: Timeline */}
              <div className="lg:col-span-4 p-6 bg-[#0e0e0e] border border-white/5 flex flex-col gap-5">
                <h3 className="font-serif text-base text-[#D4AF37]">Event Progress Pipeline</h3>
                {timeline.length > 0 ? (
                  <div className="flex flex-col gap-5">
                    {timeline.map((step: any, idx: number) => (
                      <div key={idx} className="flex gap-3 relative">
                        {idx < timeline.length - 1 && (
                          <div className="absolute left-2 top-5 w-[1px] h-8 bg-white/10" />
                        )}

                        <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 z-10 ${
                          step.status === 'completed' ? 'border-green-500 bg-green-500/10 text-green-400' :
                          step.status === 'active' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] animate-pulse' : 'border-white/10 text-gray-600'
                        }`}>
                          {step.status === 'completed' && <Check className="h-2.5 w-2.5" />}
                        </div>

                        <div className="flex flex-col">
                          <span className={`text-[10.5px] font-sans font-medium ${step.status === 'completed' ? 'text-white' : step.status === 'active' ? 'text-[#D4AF37]' : 'text-gray-500'}`}>
                            {step.label}
                          </span>
                          <span className="text-[8px] text-gray-600 font-sans mt-0.5">{step.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No active production schedule available.</p>
                )}
              </div>

              {/* Right Column: Invoices & Payments previews */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Recent Invoices */}
                <div className="p-6 bg-[#0e0e0e] border border-white/5 flex flex-col gap-4">
                  <h3 className="font-serif text-base text-[#D4AF37] flex items-center justify-between">
                    <span>Recent Billing Invoices</span>
                    <button onClick={() => setActiveTab('invoices')} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
                      View all <ChevronRight className="h-3 w-3" />
                    </button>
                  </h3>
                  {recentInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider text-[9px]">
                            <th className="pb-2.5">Invoice No</th>
                            <th className="pb-2.5">Total</th>
                            <th className="pb-2.5">Balance</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-400 font-light">
                          {recentInvoices.map((inv: any) => (
                            <tr key={inv.id}>
                              <td className="py-2.5 text-white font-medium">{inv.invoiceNumber}</td>
                              <td className="py-2.5">₹{inv.total.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-yellow-400/90 font-medium">₹{inv.balanceAmount.toLocaleString('en-IN')}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 text-[8px] font-semibold tracking-wider uppercase border ${
                                  inv.status === 'Paid' ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setViewInvoiceDetails(inv)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded-none uppercase text-[8px]"
                                  >
                                    View
                                  </button>
                                  {inv.balanceAmount > 0 && (
                                    <button
                                      onClick={() => setPaymentModalInvoice(inv)}
                                      className="px-2 py-1 bg-[#D4AF37] hover:bg-white text-[#111111] rounded-none font-bold uppercase text-[8px]"
                                    >
                                      Pay
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 py-4 text-center">No invoices generated yet.</p>
                  )}
                </div>

                {/* Recent Payments */}
                <div className="p-6 bg-[#0e0e0e] border border-white/5 flex flex-col gap-4">
                  <h3 className="font-serif text-base text-[#D4AF37] flex items-center justify-between">
                    <span>Recent Payment Logs</span>
                    <button onClick={() => setActiveTab('payments')} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
                      View all <ChevronRight className="h-3 w-3" />
                    </button>
                  </h3>
                  {recentPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider text-[9px]">
                            <th className="pb-2.5">Transaction ID</th>
                            <th className="pb-2.5">Date</th>
                            <th className="pb-2.5">Method</th>
                            <th className="pb-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-400 font-light">
                          {recentPayments.map((pm: any) => (
                            <tr key={pm.id}>
                              <td className="py-2.5 text-white font-medium truncate max-w-[120px]">{pm.transactionId}</td>
                              <td className="py-2.5">{new Date(pm.paymentDate).toLocaleDateString()}</td>
                              <td className="py-2.5">{pm.paymentMethod}</td>
                              <td className="py-2.5 text-right font-semibold text-green-400">₹{pm.amount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 py-4 text-center">No payments made yet.</p>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 2. MY BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-2xl text-white">Event Bookings Schedule</h2>
              <p className="text-gray-400 mt-1">List of registered bookings and shoot dates under your account.</p>
            </div>
            
            <div className="flex flex-col gap-4 mt-2">
              {bookings.map((book: any) => (
                <div key={book.id} className="p-6 bg-[#0e0e0e] border border-white/5 flex flex-col gap-3 md:flex-row md:items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-base text-white font-medium">{book.eventType}</h4>
                      <span className={`px-2 py-0.5 text-[8px] font-semibold tracking-wider uppercase border ${
                        book.status === 'approved' ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'
                      }`}>
                        {book.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 font-sans mt-1 uppercase font-medium">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-[#D4AF37]" /> {book.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#D4AF37]" /> {book.location}</span>
                    </div>
                    {book.message && (
                      <p className="text-xs text-gray-400 leading-relaxed font-light mt-1 max-w-xl">{book.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-sans">Budget Cost</span>
                    <span className="text-base font-serif text-[#D4AF37] font-semibold">
                      {book.budget !== null && book.budget !== undefined && book.budget !== '' ? (
                        typeof book.budget === 'number' ? `₹${book.budget.toLocaleString('en-IN')}` : book.budget
                      ) : 'TBD'}
                    </span>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <p className="text-gray-500 text-center py-20 bg-[#0e0e0e] border border-white/5">No bookings associated with this account email.</p>
              )}
            </div>
          </div>
        )}

        {/* 3. QUOTATIONS TAB */}
        {activeTab === 'quotations' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-2xl text-white">Project Quotations</h2>
              <p className="text-gray-400 mt-1">Review customized production quotations and packages.</p>
            </div>
            
            <div className="flex flex-col gap-6 mt-2 max-w-3xl">
              {bookings.map((book: any, idx: number) => (
                <div key={idx} className="p-8 bg-[#0e0e0e] border border-[#D4AF37]/20 flex flex-col gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl" />
                  <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div>
                      <span className="text-[#D4AF37] text-[9px] font-sans font-bold uppercase tracking-widest">Proposal Quote</span>
                      <h3 className="font-serif text-lg text-white mt-1">Custom Cinema Package - {book.eventType}</h3>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 border border-green-500/30 text-green-400 bg-green-500/5 font-semibold uppercase tracking-wider">Approved & Signed</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block uppercase tracking-wider text-[8px]">Shoot Date</span>
                      <span className="text-white font-medium mt-1 block">{book.date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase tracking-wider text-[8px]">Venue</span>
                      <span className="text-white font-medium mt-1 block truncate">{book.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase tracking-wider text-[8px]">Lead Director</span>
                      <span className="text-white font-medium mt-1 block">Dasari Bharadwaj</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase tracking-wider text-[8px]">Valued Package Price</span>
                      <span className="text-[#D4AF37] font-semibold mt-1 block">
                        {book.budget !== null && book.budget !== undefined && book.budget !== '' ? (
                          typeof book.budget === 'number' ? `₹${book.budget.toLocaleString('en-IN')}` : book.budget
                        ) : 'Custom Budget'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 border-t border-white/5 pt-4">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-sans font-semibold">Deliverables Included:</span>
                    <ul className="list-disc pl-4 text-gray-400 font-light flex flex-col gap-1.5">
                      <li>Full 4K ProRes Cinematic Wedding Highlights Film (3 to 5 minutes)</li>
                      <li>Traditional candid photo captures by Dasari Bharadwaj (Unlimited raw files + 200 edited masters)</li>
                      <li>Luxury bonded canvas design album print with custom case</li>
                      <li>Professional dual-operator drone cinematic coverage for outdoor sessions</li>
                    </ul>
                  </div>

                  <div className="bg-[#111111] p-4 border-l border-green-500 flex items-center justify-between text-[10px] text-gray-400 mt-2">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <Check className="h-4 w-4 text-green-400" /> Digital quotation agreement signed by {book.name}
                    </span>
                    <span className="text-gray-500 font-sans">{new Date(book.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <p className="text-gray-500 text-center py-20 bg-[#0e0e0e] border border-white/5">No active quotations found.</p>
              )}
            </div>
          </div>
        )}

        {/* 4. INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-2xl text-white">Billing Statements & Invoices</h2>
              <p className="text-gray-400 mt-1">Manage generated invoices, download PDF backups, and submit payments.</p>
            </div>
            
            <div className="p-6 bg-[#0e0e0e] border border-white/5 mt-2">
              {recentInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider text-[9px] pb-3">
                        <th className="pb-3.5">Invoice No</th>
                        <th className="pb-3.5">Issue Date</th>
                        <th className="pb-3.5">Due Date</th>
                        <th className="pb-3.5">Total Billed</th>
                        <th className="pb-3.5">Remaining Due</th>
                        <th className="pb-3.5">Status</th>
                        <th className="pb-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-400 font-light">
                      {recentInvoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 text-white font-semibold flex items-center gap-1.5">{inv.invoiceNumber}</td>
                          <td className="py-4">{inv.issueDate}</td>
                          <td className="py-4">{inv.dueDate}</td>
                          <td className="py-4">₹{inv.total.toLocaleString('en-IN')}</td>
                          <td className="py-4 text-yellow-400 font-medium">₹{inv.balanceAmount.toLocaleString('en-IN')}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 text-[8.5px] font-semibold tracking-wider uppercase border ${
                              inv.status === 'Paid' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                              inv.status === 'Cancelled' ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex gap-2 justify-end items-center">
                              <button
                                onClick={() => setViewInvoiceDetails(inv)}
                                className="px-3 py-1.5 border border-white/10 hover:border-white text-white transition-all uppercase text-[9px] rounded-none"
                                title="View invoice details"
                              >
                                View
                              </button>
                              
                              <a
                                href={`/invoices/${inv.invoiceNumber}.pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 border border-white/10 hover:border-[#D4AF37]/50 text-gray-400 hover:text-white transition-all rounded-none"
                                title="Download PDF Document"
                              >
                                <Download className="h-3.5 w-3.5 text-[#D4AF37]" />
                              </a>
                              
                              <button
                                onClick={() => triggerPrint(inv.invoiceNumber)}
                                className="p-2 border border-white/10 hover:border-white text-gray-400 hover:text-white transition-all rounded-none"
                                title="Print Invoice"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleCopyLink(inv)}
                                className="p-2 border border-white/10 hover:border-white text-gray-400 hover:text-white transition-all rounded-none relative"
                                title="Copy Invoice URL"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                {copiedInvoiceNumber === inv.invoiceNumber && (
                                  <span className="absolute -top-7 right-0 bg-[#D4AF37] text-[#111111] px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">Copied</span>
                                )}
                              </button>

                              <button
                                onClick={() => handleWhatsAppShare(inv)}
                                className="p-2 border border-white/10 hover:border-green-500/30 text-gray-400 hover:text-green-400 transition-all rounded-none"
                                title="Share on WhatsApp"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>

                              {inv.balanceAmount > 0 && (
                                <button
                                  onClick={() => setPaymentModalInvoice(inv)}
                                  className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold transition-all uppercase text-[9px] rounded-none shrink-0"
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-20">No invoice statements generated.</p>
              )}
            </div>
          </div>
        )}

        {/* 5. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-2xl text-white">Payment Transactions</h2>
              <p className="text-gray-400 mt-1">Review successful transaction summaries and download payment receipts.</p>
            </div>
            
            <div className="p-6 bg-[#0e0e0e] border border-white/5 mt-2">
              {recentPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider text-[9px] pb-3">
                        <th className="pb-3.5">Transaction ID</th>
                        <th className="pb-3.5">Payment Date</th>
                        <th className="pb-3.5">Payment Method</th>
                        <th className="pb-3.5">Amount Paid</th>
                        <th className="pb-3.5">Status</th>
                        <th className="pb-3.5 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-400 font-light">
                      {recentPayments.map((pm: any) => (
                        <tr key={pm.id} className="hover:bg-white/[0.01]">
                          <td className="py-4 text-white font-semibold">{pm.transactionId}</td>
                          <td className="py-4">{new Date(pm.paymentDate).toLocaleString()}</td>
                          <td className="py-4">{pm.paymentMethod}</td>
                          <td className="py-4 text-green-400 font-semibold">₹{pm.amount.toLocaleString('en-IN')}</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 border border-green-500/30 text-green-400 bg-green-500/5 text-[8.5px] font-bold uppercase tracking-wider">
                              {pm.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => setReceiptModalPayment(pm)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all uppercase text-[9px] rounded-none"
                            >
                              Get Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-20">No payments logs recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* 6. GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-2xl text-white">Private Proofs Gallery</h2>
              <p className="text-gray-400 mt-1">Review selection proofs from the post-production shoot archives.</p>
            </div>
            
            {albumPhotos && albumPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                {albumPhotos.map((photo: string, idx: number) => (
                  <div key={idx} className="aspect-square bg-zinc-900 border border-white/5 overflow-hidden relative group">
                    <img
                      src={photo}
                      alt={`Wedding shoot proof still ${idx}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[#000000]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                      <a href={photo} target="_blank" rel="noreferrer" className="px-4 py-2 border border-white text-white uppercase text-[8px] tracking-widest font-sans font-bold hover:bg-white hover:text-black">Expand Still</a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-20 bg-[#0e0e0e] border border-white/5 mt-2">Your photos are currently in post-processing. Once candidate stills are exported, they will appear here.</p>
            )}
          </div>
        )}

        {/* 7. DOWNLOADS TAB */}
        {activeTab === 'downloads' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-2xl text-white">Master Deliverables</h2>
              <p className="text-gray-400 mt-1">Download raw assets, edited high-resolution files, cinematic videos, and invoices.</p>
            </div>
            
            <div className="flex flex-col gap-3.5 mt-2">
              {downloads && downloads.length > 0 ? (
                downloads.map((dl: any, idx: number) => (
                  <div key={idx} className="p-5 border border-white/5 bg-[#0e0e0e] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
                        <Download className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-white text-xs">{dl.label}</span>
                        <span className="text-[10px] text-gray-500">File size: {dl.size}</span>
                      </div>
                    </div>
                    <a
                      href={dl.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 border border-[#D4AF37]/30 hover:border-[#D4AF37] text-gray-400 hover:text-white transition-colors uppercase tracking-wider text-[10px] rounded-none shrink-0"
                    >
                      Download Deliverable
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-20 bg-[#0e0e0e] border border-white/5">Your master files are in post-production. You will be notified via email when they are available for download.</p>
              )}
            </div>
          </div>
        )}

        {/* 8. PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-6 max-w-2xl">
            <div>
              <h2 className="font-serif text-2xl text-white">Billing Profile Details</h2>
              <p className="text-gray-400 mt-1">Configure company name and billing address for invoice generation.</p>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-8 border border-white/5 bg-[#0e0e0e] flex flex-col gap-5 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="prof-name" className="text-gray-500 uppercase tracking-widest text-[8px]">Client Full Name</label>
                  <input
                    id="prof-name"
                    name="name"
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="prof-phone" className="text-gray-500 uppercase tracking-widest text-[8px]">Mobile Phone</label>
                  <input
                    id="prof-phone"
                    name="phone"
                    type="text"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-company" className="text-gray-500 uppercase tracking-widest text-[8px]">Company Name (Optional)</label>
                <input
                  id="prof-company"
                  name="company"
                  type="text"
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  placeholder="e.g. Reddy Group of Industries"
                  className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-address" className="text-gray-500 uppercase tracking-widest text-[8px]">Billing Address</label>
                <textarea
                  id="prof-address"
                  name="address"
                  rows={4}
                  required
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP Code"
                  className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all rounded-none mt-2"
              >
                Save Profile Configuration
              </button>

              {profileSaveSuccess && (
                <p className="text-green-400 text-center font-medium mt-1">Profile settings saved successfully!</p>
              )}
            </form>
          </div>
        )}

        {/* 9. SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="flex flex-col gap-6 max-w-2xl">
            <div>
              <h2 className="font-serif text-2xl text-white">Client Portal Support</h2>
              <p className="text-gray-400 mt-1">Contact the studio team or raise a support ticket directly with our crew.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="p-6 bg-[#0e0e0e] border border-white/5 flex flex-col gap-4">
                <h3 className="font-serif text-base text-[#D4AF37]">Direct Contact</h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  If you need immediate production scheduling, shoot modifications, or assistance with assets downloads, reach out directly.
                </p>
                <div className="flex flex-col gap-2.5 font-sans mt-2">
                  <span className="text-gray-500 uppercase text-[8px] tracking-wider block">Lead Director</span>
                  <span className="text-white font-medium text-xs">{siteSettings.founderName || 'Dasari Bharadwaj'}</span>
                  
                  <span className="text-gray-500 uppercase text-[8px] tracking-wider block mt-2">Phone Call</span>
                  <span className="text-white font-medium text-xs">{siteSettings.phone || '+91 88850 60808'}</span>
                  
                  <span className="text-gray-500 uppercase text-[8px] tracking-wider block mt-2">Email Inbox</span>
                  <span className="text-white font-medium text-xs">{siteSettings.email || 'dopdasari@gmail.com'}</span>
                </div>
              </div>

              <form onSubmit={handleSupportSubmit} className="p-6 bg-[#0e0e0e] border border-white/5 flex flex-col gap-4">
                <h3 className="font-serif text-base text-[#D4AF37]">Raise Support Ticket</h3>
                <div className="flex flex-col gap-1.5 mt-2">
                  <label htmlFor="sup-msg" className="text-gray-500 uppercase tracking-widest text-[8px]">Message details</label>
                  <textarea
                    id="sup-msg"
                    name="message"
                    rows={5}
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Write details of any issues with file downloads, payments, or booking updates..."
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none text-xs resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all rounded-none"
                >
                  Submit Ticket
                </button>
                {supportSuccess && (
                  <p className="text-green-400 text-center font-medium mt-1">Ticket submitted successfully! We will reply via email.</p>
                )}
              </form>
            </div>
          </div>
        )}

      </main>

      {/* VIEW INVOICE DETAIL MODAL */}
      {viewInvoiceDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
          <div className="bg-white text-black max-w-3xl w-full p-8 md:p-10 font-sans shadow-2xl relative my-8">
            <button
              onClick={() => setViewInvoiceDetails(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-black transition-colors"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Print Area start */}
            <div className="flex flex-col gap-6" id="printable-invoice">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-[#D4AF37] pb-4">
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-wider">{siteSettings.businessName || 'FRAME BY DB'}</h1>
                  <span className="text-[10px] uppercase text-[#D4AF37] font-semibold tracking-widest">{siteSettings.founderName || 'Dasari Bharadwaj'}</span>
                </div>
                <div className="text-right">
                  <h2 className="font-serif text-2xl font-bold text-gray-800 tracking-wide">INVOICE</h2>
                  <span className="text-xs font-semibold text-gray-900 block mt-1">No: {viewInvoiceDetails.invoiceNumber}</span>
                  <span className="text-[10px] text-gray-500 block">Date: {viewInvoiceDetails.issueDate}</span>
                  <span className="text-[10px] text-gray-500 block">Due Date: {viewInvoiceDetails.dueDate}</span>
                  <span className={`text-[10px] font-bold block mt-1 uppercase ${viewInvoiceDetails.status === 'Paid' ? 'text-green-600' : 'text-[#D4AF37]'}`}>Status: {viewInvoiceDetails.status}</span>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-8 text-xs leading-relaxed">
                <div>
                  <span className="text-[#D4AF37] font-bold block uppercase text-[9px] tracking-wider mb-1">BILL TO:</span>
                  <p className="font-bold text-gray-900 text-sm">{client.name}</p>
                  {client.companyName && <p className="font-medium text-gray-800">{client.companyName}</p>}
                  <p className="text-gray-600">{client.email}</p>
                  <p className="text-gray-600">{client.phone}</p>
                  {client.billingAddress && <p className="text-gray-600 mt-1 max-w-xs">{client.billingAddress}</p>}
                </div>
                <div>
                  <span className="text-[#D4AF37] font-bold block uppercase text-[9px] tracking-wider mb-1">FROM:</span>
                  <p className="font-bold text-gray-900 text-sm">{siteSettings.businessName || 'Frame by DB'}</p>
                  <p className="text-gray-600">{siteSettings.phone || '+91 88850 60808'}</p>
                  <p className="text-gray-600">{siteSettings.email || 'dopdasari@gmail.com'}</p>
                  <p className="text-gray-600">{siteSettings.location || 'Hyderabad, India'}</p>
                  {siteSettings.gstNumber && <p className="text-gray-600 font-semibold mt-1">GST: {siteSettings.gstNumber}</p>}
                  {siteSettings.panNumber && <p className="text-gray-600 font-semibold">PAN: {siteSettings.panNumber}</p>}
                </div>
              </div>

              {/* Itemized Table */}
              <div className="mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#D4AF37] text-white uppercase text-[9px] font-bold tracking-wider">
                      <th className="p-2.5">Item & Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {viewInvoiceDetails.items && viewInvoiceDetails.items.map((item: any, idx: number) => (
                      <tr key={idx} className="text-gray-700">
                        <td className="p-2.5">
                          <p className="font-bold text-gray-900">{item.serviceName}</p>
                          {item.description && <p className="text-[10px] text-gray-500 italic mt-0.5">{item.description}</p>}
                        </td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-semibold text-gray-900">₹{item.total.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Block */}
              <div className="flex justify-end mt-4">
                <div className="w-64 text-xs flex flex-col gap-2">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-medium text-gray-800">₹{viewInvoiceDetails.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {viewInvoiceDetails.tax > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>GST Tax:</span>
                      <span className="font-medium text-gray-800">₹{viewInvoiceDetails.tax.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {viewInvoiceDetails.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount:</span>
                      <span className="font-medium">-₹{viewInvoiceDetails.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="h-[1px] bg-gray-300 my-1" />
                  <div className="flex justify-between font-bold text-sm text-gray-900">
                    <span>Grand Total:</span>
                    <span className="text-[#D4AF37]">₹{viewInvoiceDetails.total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[10px]">
                    <span>Amount Paid:</span>
                    <span className="font-medium text-green-600">₹{viewInvoiceDetails.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-[1px] bg-gray-200" />
                  <div className="flex justify-between font-bold text-xs text-gray-900 bg-gray-50 p-1.5 border-l-2 border-[#D4AF37]">
                    <span>Balance Due:</span>
                    <span className="text-[#D4AF37]">₹{viewInvoiceDetails.balanceAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6 text-[10px] leading-relaxed mt-4">
                <div>
                  <span className="text-[#D4AF37] font-bold block uppercase text-[8px] tracking-wider mb-1">PAYMENT INSTRUCTIONS:</span>
                  <p className="font-semibold text-gray-800">Bank Account Details:</p>
                  <p className="text-gray-600 mt-0.5">Account Holder: {siteSettings.founderName || 'Dasari Bharadwaj'}</p>
                  <p className="text-gray-600">Bank: {siteSettings.bankName || 'HDFC Bank'}</p>
                  <p className="text-gray-600">A/C Number: {siteSettings.accountNumber || 'N/A'}</p>
                  <p className="text-gray-600">IFSC Code: {siteSettings.ifscCode || 'N/A'}</p>
                  {siteSettings.upiId && (
                    <div className="mt-2 flex items-center gap-3">
                      <div>
                        <p className="text-gray-800 font-bold">UPI ID: {siteSettings.upiId}</p>
                        <p className="text-gray-500 text-[8px]">Scan the QR Code to pay directly via GPay / PhonePe / Paytm.</p>
                      </div>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${siteSettings.upiId}&pn=${siteSettings.founderName || 'Dasari'}&am=${viewInvoiceDetails.balanceAmount}&cu=INR&tn=${viewInvoiceDetails.invoiceNumber}`)}`}
                        alt="UPI QR Payment"
                        className="h-14 w-14 border border-gray-200 shrink-0"
                      />
                    </div>
                  )}
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                  <div>
                    <span className="text-[#D4AF37] font-bold block uppercase text-[8px] tracking-wider mb-1">AUTHORIZED SIGNATURE:</span>
                    <p className="font-serif italic text-lg text-gray-800 mt-3 font-semibold">Dasari Bharadwaj</p>
                    <div className="w-40 h-[0.5px] bg-gray-300 my-1 align-right ml-auto" />
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Founder & DOP, Frame by DB</p>
                  </div>
                </div>
              </div>

              {/* T&C */}
              <div className="border-t border-gray-100 pt-4 text-[8px] text-gray-400 leading-normal">
                <p className="font-semibold uppercase text-gray-500 mb-0.5">Terms & Conditions:</p>
                <p>1. Payment of the balance due is required as per the contract timeline. Deliverables are uploaded post clearing balance dues.</p>
                <p>2. Frame by DB reserves rights to raw file archiving. High-resolution files are kept in active database for 6 months only.</p>
              </div>

            </div>
            {/* Print Area end */}

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end mt-8 border-t border-gray-200 pt-6">
              <button
                onClick={() => setViewInvoiceDetails(null)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs uppercase tracking-wider font-semibold rounded-none"
              >
                Close View
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-800 hover:bg-gray-900 hover:text-white text-gray-800 text-xs uppercase tracking-wider font-semibold rounded-none flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Print Invoice
              </button>
              <a
                href={`/invoices/${viewInvoiceDetails.invoiceNumber}.pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#D4AF37] hover:bg-black hover:text-white text-[#111111] text-xs uppercase tracking-wider font-bold rounded-none flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MAKE PAYMENT MODAL */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 max-w-md w-full p-8 relative font-sans text-xs">
            <button
              onClick={() => setPaymentModalInvoice(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col gap-6 items-center text-center">
              <div className="p-3 bg-green-500/10 rounded-full text-green-400">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-white">Settle Pending Invoice Balance</h3>
                <p className="text-gray-500 mt-1 uppercase tracking-widest text-[9px]">{paymentModalInvoice.invoiceNumber}</p>
              </div>

              <div className="w-full bg-[#111111] p-4 border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Total:</span>
                  <span className="text-white font-medium">₹{paymentModalInvoice.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid:</span>
                  <span className="text-green-400 font-medium">₹{paymentModalInvoice.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-[1px] bg-white/5 my-1" />
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-300">Balance Due:</span>
                  <span className="text-[#D4AF37]">₹{paymentModalInvoice.balanceAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {siteSettings.upiId && (
                <div className="flex flex-col items-center gap-3 border-t border-white/5 pt-4 w-full">
                  <span className="text-[#D4AF37] font-semibold uppercase tracking-widest text-[9px]">Scan QR to Pay via UPI</span>
                  
                  {/* Generate Real UPI QR Code */}
                  <div className="p-3 bg-white">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `upi://pay?pa=${siteSettings.upiId}&pn=${encodeURIComponent(siteSettings.founderName || 'Dasari Bharadwaj')}&am=${paymentModalInvoice.balanceAmount}&cu=INR&tn=${paymentModalInvoice.invoiceNumber}`
                      )}`}
                      alt="UPI QR Code Payment"
                      className="h-32 w-32 object-contain"
                    />
                  </div>
                  <span className="text-white font-semibold tracking-wider text-[10px]">UPI ID: {siteSettings.upiId}</span>
                  <span className="text-gray-600 text-[8px] max-w-xs">Scan using GPay, PhonePe, Paytm, or BHIM. Amount will be auto-filled for ₹{paymentModalInvoice.balanceAmount.toLocaleString('en-IN')}.</span>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full mt-2">
                <button
                  disabled={paymentLoading}
                  onClick={() => handlePayInvoice(paymentModalInvoice.id, paymentModalInvoice.balanceAmount)}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-colors rounded-none"
                >
                  {paymentLoading ? 'Simulating payment gateways...' : 'Simulate Successful Payment'}
                </button>
                <button
                  onClick={() => setPaymentModalInvoice(null)}
                  className="w-full py-2.5 border border-white/10 hover:border-white text-gray-400 hover:text-white transition-colors rounded-none"
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RECEIPT MODAL */}
      {receiptModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white text-black max-w-md w-full p-8 relative font-sans shadow-2xl">
            <button
              onClick={() => setReceiptModalPayment(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col gap-5 text-xs">
              <div className="text-center border-b border-gray-200 pb-4">
                <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">Payment Receipt</span>
                <h3 className="font-serif text-xl font-bold mt-1">{siteSettings.businessName || 'FRAME BY DB'}</h3>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">{siteSettings.location || 'Hyderabad, India'}</p>
              </div>

              <div className="flex flex-col gap-3 font-medium text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="text-gray-900 font-bold">{receiptModalPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Receipt Date:</span>
                  <span className="text-gray-900">{new Date(receiptModalPayment.paymentDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="text-gray-900">{receiptModalPayment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-bold uppercase tracking-wider">SUCCESS</span>
                </div>
                
                <div className="h-[1px] bg-gray-200 my-2" />

                <div className="flex justify-between text-sm">
                  <span className="text-gray-900 font-bold uppercase">Amount Cleared:</span>
                  <span className="text-[#D4AF37] font-bold text-base">₹{receiptModalPayment.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 border-l-2 border-[#D4AF37] text-gray-600 font-light mt-2 leading-relaxed">
                Thank you for choosing Frame by DB. This document confirms receipt of your payment toward Dasari Bharadwaj photography production services. A copy has been saved under your portal accounting records.
              </div>

              <div className="flex gap-2 justify-end mt-4 border-t border-gray-200 pt-4">
                <button
                  onClick={() => setReceiptModalPayment(null)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-none"
                >
                  Close Receipt
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-900 text-white hover:bg-black font-semibold rounded-none flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
