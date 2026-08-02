'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Lock, LayoutDashboard, Calendar, Camera, Images, FileText, Settings, 
  LogOut, CheckCircle2, XCircle, Trash2, Plus, Save, Award,
  CreditCard, Copy, Printer, Share2, Send, History, ExternalLink, RefreshCw, Eye, X,
  Bell, Edit2, CheckSquare
} from 'lucide-react';

export default function AdminClient() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'analytics' | 'bookings' | 'portfolio' | 'gallery' | 'blogs' | 'settings' | 'invoices'>('analytics');
  const [bookings, setBookings] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Notifications states
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; createdAt: string; read: boolean }>>([]);
  const [prevBookingsCount, setPrevBookingsCount] = useState<number | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // CRM Search & Filters states
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('all');
  const [bookingFilterEventType, setBookingFilterEventType] = useState('all');
  const [bookingFilterDate, setBookingFilterDate] = useState('');

  // Selected CRM items states
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  
  // Invoice CMS states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyInvoice, setHistoryInvoice] = useState<any | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState('all');
  
  const [invoiceForm, setInvoiceForm] = useState<any>({
    id: '', // empty for new
    invoiceNumber: '',
    bookingId: '',
    clientId: '',
    issueDate: '',
    dueDate: '',
    discount: 0,
    tax: 0,
    paidAmount: 0,
    notes: '',
    items: [{ serviceName: '', description: '', quantity: 1, price: 0, tax: 0, total: 0 }]
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Form states for adding items
  const [newPort, setNewPort] = useState({ title: '', client: '', category: 'Weddings', location: '', date: '', image: '', videoUrl: '', details: '' });
  const [newGal, setNewGal] = useState({ title: '', category: 'Weddings', image: '', type: 'image', videoUrl: '' });
  const [newBlog, setNewBlog] = useState({ title: '', slug: '', summary: '', content: '', category: 'Cinematography', readTime: '5 min', image: '', isFeatured: false });

  const loadDashboardData = useCallback(async () => {
    try {
      const [bookRes, portRes, galRes, blogRes, setRes, invRes, clRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/portfolio'),
        fetch('/api/gallery'),
        fetch('/api/blogs'),
        fetch('/api/settings'),
        fetch('/api/admin/invoices'),
        fetch('/api/admin/clients')
      ]);

      const [bookData, portData, galData, blogData, setData, invData, clData] = await Promise.all([
        bookRes.json(),
        portRes.json(),
        galRes.json(),
        blogRes.json(),
        setRes.json(),
        invRes.ok ? invRes.json() : [],
        clRes.ok ? clRes.json() : []
      ]);

      setBookings(bookData);
      setPortfolio(portData);
      setGallery(galData);
      setBlogs(blogData);
      setSiteSettings(setData);
      setInvoices(invData);
      setClients(clData);
    } catch (err) {
      console.error('Failed to load admin panel data:', err);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setIsLoggedIn(data.isLoggedIn);
      if (data.isLoggedIn) {
        await loadDashboardData();
      }
    } catch {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Real-time automatic polling (every 5 seconds)
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn, loadDashboardData]);

  // Compute notifications when bookings list grows
  useEffect(() => {
    if (isLoggedIn && prevBookingsCount !== null && bookings.length > prevBookingsCount) {
      const difference = bookings.length - prevBookingsCount;
      const newBookings = bookings.slice(0, difference);
      const newNotifs = newBookings.map(b => ({
        id: `notif_${b.id}_${Date.now()}`,
        message: `New booking request from ${b.name} for ${b.eventType}`,
        createdAt: new Date().toISOString(),
        read: false
      }));
      setNotifications(prev => [...newNotifs, ...prev]);
    }
    setPrevBookingsCount(bookings.length);
  }, [bookings, isLoggedIn, prevBookingsCount]);

  // CRM Search & Filters Memo
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = !bookingSearch || 
        b.name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.phone.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.email.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.id.toLowerCase().includes(bookingSearch.toLowerCase());
        
      const matchStatus = bookingFilterStatus === 'all' || b.status.toLowerCase() === bookingFilterStatus.toLowerCase();
      const matchEventType = bookingFilterEventType === 'all' || b.eventType.toLowerCase().includes(bookingFilterEventType.toLowerCase());
      const matchDate = !bookingFilterDate || b.date.includes(bookingFilterDate);
      
      return matchSearch && matchStatus && matchEventType && matchDate;
    });
  }, [bookings, bookingSearch, bookingFilterStatus, bookingFilterEventType, bookingFilterDate]);

  const handleQuickStatus = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(bookings.map(b => b.id === id ? updated : b));
        if (selectedBookingDetails && selectedBookingDetails.id === id) {
          setSelectedBookingDetails(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBookingAll = async (targetBooking: any) => {
    const isEvent = targetBooking && typeof targetBooking.preventDefault === 'function';
    if (isEvent) {
      targetBooking.preventDefault();
    }
    const dataToSave = isEvent ? editingBooking : targetBooking;
    if (!dataToSave) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${dataToSave.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(bookings.map(b => b.id === dataToSave.id ? updated : b));
        if (selectedBookingDetails && selectedBookingDetails.id === dataToSave.id) {
          setSelectedBookingDetails(updated);
        }
        setEditingBooking(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoiceFromBooking = (booking: any) => {
    const client = clients.find(c => c.email.toLowerCase() === booking.email.toLowerCase());
    setInvoiceForm({
      id: '',
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      bookingId: booking.id,
      clientId: client ? client.id : '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount: 0,
      tax: 0,
      paidAmount: 0,
      notes: `Quotation generated for Booking ${booking.id}`,
      items: [{ 
        serviceName: booking.eventType, 
        description: `Event Location: ${booking.location}. Date: ${booking.date}`, 
        quantity: 1, 
        price: parseFloat((booking.budget || '').replace(/[^0-9.]/g, '')) || 0, 
        tax: 0, 
        total: parseFloat((booking.budget || '').replace(/[^0-9.]/g, '')) || 0 
      }]
    });
    setActiveTab('invoices');
    setIsInvoiceModalOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        setIsLoggedIn(true);
        await loadDashboardData();
      } else {
        const errData = await res.json();
        setLoginError(errData.error || 'Authentication failed');
      }
    } catch {
      setLoginError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setIsLoggedIn(false);
      setBookings([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookingDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBookings(bookings.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAllBookings = async () => {
    if (!confirm('Are you sure you want to clear ALL booking request inquiries? This will permanently delete all logs.')) return;
    if (!confirm('Double check: Are you absolutely sure? This action is irreversible.')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/bookings', { method: 'DELETE' });
      if (res.ok) {
        setBookings([]);
        alert('All inquiries have been successfully cleared.');
      } else {
        const errData = await res.json();
        alert(`Failed to clear inquiries: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPort)
      });
      if (res.ok) {
        const item = await res.json();
        setPortfolio([...portfolio, item]);
        setNewPort({ title: '', client: '', category: 'Weddings', location: '', date: '', image: '', videoUrl: '', details: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Delete project post?')) return;
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPortfolio(portfolio.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGal)
      });
      if (res.ok) {
        const item = await res.json();
        setGallery([...gallery, item]);
        setNewGal({ title: '', category: 'Weddings', image: '', type: 'image', videoUrl: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Delete gallery item?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGallery(gallery.filter(g => g.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBlog,
          createdAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        const post = await res.json();
        setBlogs([...blogs, post]);
        setNewBlog({ title: '', slug: '', summary: '', content: '', category: 'Cinematography', readTime: '5 min', image: '', isFeatured: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Delete blog post?')) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBlogs(blogs.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings)
      });
      if (res.ok) {
        setSaveStatus('Settings updated successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('Error saving settings.');
      }
    } catch {
      setSaveStatus('Error saving settings.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSettingsFieldChange = (key: string, value: any) => {
    setSiteSettings({ ...siteSettings, [key]: value });
  };

  // Invoice Action Handlers
  const handleOpenNewInvoiceModal = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const invoiceNum = `INV-${year}-${rand}`;
    
    setInvoiceForm({
      id: '',
      invoiceNumber: invoiceNum,
      bookingId: '',
      clientId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount: 0,
      tax: 0,
      paidAmount: 0,
      notes: 'Thank you for choosing Frame by DB. Deliverables will be released post clearance of dues.',
      items: [{ serviceName: '', description: '', quantity: 1, price: 0, tax: 0, total: 0 }]
    });
    setIsInvoiceModalOpen(true);
  };

  const handleOpenEditInvoiceModal = (inv: any) => {
    setInvoiceForm({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      bookingId: inv.bookingId || '',
      clientId: inv.clientId,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      discount: inv.discount,
      tax: inv.tax,
      paidAmount: inv.paidAmount,
      notes: inv.notes || '',
      items: inv.items && inv.items.length > 0 ? inv.items.map((it: any) => ({
        serviceName: it.serviceName,
        description: it.description || '',
        quantity: it.quantity,
        price: it.price,
        tax: it.tax,
        total: it.total
      })) : [{ serviceName: '', description: '', quantity: 1, price: 0, tax: 0, total: 0 }]
    });
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceItemChange = (idx: number, field: string, val: any) => {
    const updatedItems = [...invoiceForm.items];
    updatedItems[idx] = {
      ...updatedItems[idx],
      [field]: val
    };
    if (field === 'price' || field === 'quantity') {
      updatedItems[idx].total = Number(updatedItems[idx].price || 0) * Number(updatedItems[idx].quantity || 1);
    }
    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems
    });
  };

  const handleAddInvoiceItemRow = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { serviceName: '', description: '', quantity: 1, price: 0, tax: 0, total: 0 }]
    });
  };

  const handleRemoveInvoiceItemRow = (idx: number) => {
    if (invoiceForm.items.length <= 1) return;
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_: any, i: number) => i !== idx)
    });
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const isEdit = !!invoiceForm.id;
      const url = isEdit ? `/api/admin/invoices/${invoiceForm.id}` : '/api/admin/invoices';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceForm)
      });

      if (res.ok) {
        setIsInvoiceModalOpen(false);
        await loadDashboardData();
        alert(isEdit ? 'Invoice updated and PDF compiled successfully!' : 'Invoice generated, PDF saved, and client notified successfully!');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to save invoice'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateInvoice = async (id: string) => {
    if (!confirm('Duplicate this invoice?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        await loadDashboardData();
        alert('Invoice duplicated as Draft successfully!');
      } else {
        alert('Failed to duplicate invoice.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvoice = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}/send`, { method: 'POST' });
      if (res.ok) {
        alert('Invoice emailed to client successfully!');
      } else {
        alert('Failed to send email.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This is permanent.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInvoices(invoices.filter(inv => inv.id !== id));
        alert('Invoice deleted.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickMarkPaid = async (inv: any) => {
    if (!confirm(`Mark Invoice ${inv.invoiceNumber} as fully paid?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${inv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: inv.total,
          status: 'Paid'
        })
      });
      if (res.ok) {
        await loadDashboardData();
        alert('Invoice marked as Paid.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickMarkPartial = async (inv: any) => {
    const amtStr = prompt(`Enter amount paid (Current Paid: ₹${inv.paidAmount}, Total: ₹${inv.total}):`);
    if (amtStr === null) return;
    const paidAmt = Number(amtStr);
    if (isNaN(paidAmt) || paidAmt < 0 || paidAmt > inv.total) {
      alert('Invalid amount.');
      return;
    }
    setActionLoading(true);
    try {
      const status = paidAmt === inv.total ? 'Paid' : 'Pending';
      const res = await fetch(`/api/admin/invoices/${inv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: paidAmt,
          status
        })
      });
      if (res.ok) {
        await loadDashboardData();
        alert('Invoice payment recorded.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenHistoryModal = async (inv: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${inv.id}`);
      if (res.ok) {
        const fullInv = await res.json();
        setHistoryInvoice(fullInv);
        setIsHistoryModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center text-xs text-gray-500 uppercase tracking-widest font-sans">
        Initializing Secure Panel...
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#111111] px-6 py-20 relative">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        <div className="max-w-md w-full bg-[#0a0a0a] border border-[#D4AF37]/20 p-8 md:p-10 relative z-10 flex flex-col items-center">
          <div className="p-3.5 bg-[#D4AF37]/10 rounded-full text-[#D4AF37] mb-6">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl text-white mb-2">CMS Command Center</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center mb-8 font-sans">
            Authorized Personnel Access Only
          </p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5 font-sans text-xs">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-username" className="text-[9px] uppercase tracking-widest text-gray-400">Username</label>
              <input
                id="login-username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none font-sans"
                autoComplete="username"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-[9px] uppercase tracking-widest text-gray-400">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none font-sans"
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-[10px] mt-1 text-center font-sans">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 rounded-none mt-2"
            >
              {loading ? 'Verifying...' : 'Login to Dashboard'}
            </button>
          </form>
          
          <div className="mt-8 text-center text-[10px] text-gray-500 font-sans flex flex-col gap-1">
            <p>Demo Credentials:</p>
            <p><strong>Username:</strong> admin &bull; <strong>Password:</strong> password123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col lg:flex-row font-sans text-xs w-full">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#0a0a0a] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-between py-8 px-6 shrink-0">
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/do4nuj2kh/image/upload/v1784222954/56fb26d7-1364-4020-ad1d-2cd65e216fe4_dxzyee.png"
              alt="Frame by DB Logo"
              className="h-8 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="font-serif text-sm font-semibold tracking-wider">Frame by DB</span>
              <span className="text-[8px] text-[#D4AF37] uppercase tracking-widest font-bold">Admin Panel</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'analytics' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 text-[#D4AF37]" /> Analytics
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-4 py-3 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'bookings' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4 text-[#D4AF37]" /> Inquiries ({bookings.length})
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`w-full flex items-center gap-3 px-4 py-3 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'portfolio' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Camera className="h-4 w-4 text-[#D4AF37]" /> Portfolio CMS
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`w-full flex items-center gap-3 px-4 py-3 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'gallery' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Images className="h-4 w-4 text-[#D4AF37]" /> Gallery CMS
            </button>

            <button
              onClick={() => setActiveTab('blogs')}
              className={`w-full flex items-center gap-3 px-4 py-3 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'blogs' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4 text-[#D4AF37]" /> Blogs CMS
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center gap-3 px-4 py-3 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'invoices' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard className="h-4 w-4 text-[#D4AF37]" /> Invoices CMS ({invoices.length})
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'settings' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4 text-[#D4AF37]" /> Global Settings
            </button>

            <Link
              href="/"
              className="w-full flex items-center gap-3 px-4 py-3 uppercase tracking-wider text-left border-l-2 border-transparent text-gray-400 hover:text-white transition-all"
            >
              <ExternalLink className="h-4 w-4 text-[#D4AF37]" /> View Website
            </Link>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-400 transition-colors uppercase tracking-wider text-left border-l-2 border-transparent mt-12"
        >
          <LogOut className="h-4 w-4" /> Logout Panel
        </button>
      </aside>

      {/* Main Console Stage */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-h-screen">
        {/* Top Header Bar for Notifications */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Active Command Console</span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative p-2 bg-white/5 border border-white/5 hover:border-[#D4AF37]/35 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <Bell className="h-4 w-4 text-[#D4AF37]" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-[#111111] text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            {showNotifPanel && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0a0a0a] border border-[#D4AF37]/30 shadow-2xl z-50 p-4 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <span className="font-semibold text-white uppercase tracking-wider text-[9px]">Notifications</span>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                      className="text-[9px] text-[#D4AF37] hover:text-white transition-colors uppercase tracking-wider font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto scrollbar-none">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-2.5 border border-white/5 ${n.read ? 'bg-transparent text-gray-400' : 'bg-[#D4AF37]/5 text-white'}`}>
                      <p className="font-light leading-relaxed">{n.message}</p>
                      <span className="text-[9px] text-gray-600 mt-1 block">{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-center text-gray-500 py-6">No new notifications.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Tab 1: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-10">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-white">System Analytics</h2>
              <p className="text-gray-400 mt-1">Snapshot of operations and site metrics.</p>
            </div>

            {/* Quick Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-[#0a0a0a] border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Total Bookings</span>
                  <span className="text-xl font-serif text-white font-semibold">{bookings.length}</span>
                </div>
              </div>

              <div className="p-6 bg-[#0a0a0a] border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Portfolio Projects</span>
                  <span className="text-xl font-serif text-white font-semibold">{portfolio.length}</span>
                </div>
              </div>

              <div className="p-6 bg-[#0a0a0a] border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
                  <Images className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Media Assets</span>
                  <span className="text-xl font-serif text-white font-semibold">{gallery.length}</span>
                </div>
              </div>

              <div className="p-6 bg-[#0a0a0a] border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Blog Articles</span>
                  <span className="text-xl font-serif text-white font-semibold">{blogs.length}</span>
                </div>
              </div>
            </div>

            {/* Inquiries preview list */}
            <div className="p-8 border border-white/5 bg-[#0a0a0a] flex flex-col gap-6">
              <span className="text-[#D4AF37] font-semibold uppercase tracking-wider font-sans">Recent Inquiries</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Event</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-400 font-light">
                    {bookings.slice(0, 3).map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 text-white font-medium">{item.name}</td>
                        <td className="py-3">{item.eventType}</td>
                        <td className="py-3">{item.date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase border ${
                            item.status === 'approved' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                            item.status === 'rejected' ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bookings Manager */}
        {activeTab === 'bookings' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-white">Lead & Booking Manager</h2>
                <p className="text-gray-400 mt-1">Review active booking request timelines and general inquiries.</p>
              </div>
              {bookings.length > 0 && (
                <button
                  disabled={actionLoading}
                  onClick={handleClearAllBookings}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none text-[10px] self-start sm:self-center font-sans"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All Inquiries
                </button>
              )}
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border border-white/5 bg-[#0a0a0a]">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Search Name/Phone/Email</label>
                <input
                  type="text"
                  placeholder="e.g. Bharadwaj"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-sans"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Filter by Status</label>
                <select
                  value={bookingFilterStatus}
                  onChange={(e) => setBookingFilterStatus(e.target.value)}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-sans"
                >
                  <option value="all">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Quotation Sent">Quotation Sent</option>
                  <option value="Advance Paid">Advance Paid</option>
                  <option value="Shoot Scheduled">Shoot Scheduled</option>
                  <option value="Shoot Completed">Shoot Completed</option>
                  <option value="Editing">Editing</option>
                  <option value="Gallery Ready">Gallery Ready</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Filter by Event Type</label>
                <select
                  value={bookingFilterEventType}
                  onChange={(e) => setBookingFilterEventType(e.target.value)}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-sans"
                >
                  <option value="all">All Events</option>
                  <option value="Wedding">Weddings</option>
                  <option value="Cinematic">Cinematic</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Filter by Date</label>
                <input
                  type="date"
                  value={bookingFilterDate}
                  onChange={(e) => setBookingFilterDate(e.target.value)}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-sans"
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="border border-white/5 bg-[#0a0a0a] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs min-w-[1000px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider text-[9px] bg-[#111111]/50">
                      <th className="p-4">Booking ID</th>
                      <th className="p-4">Client Name</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Event Type</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Budget</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created At</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300 font-light">
                    {filteredBookings.map((book) => (
                      <tr key={book.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono text-[10px] text-[#D4AF37]">{book.id}</td>
                        <td className="p-4 font-medium text-white">{book.name}</td>
                        <td className="p-4 text-[10px]">
                          <div className="flex flex-col">
                            <span>{book.phone}</span>
                            <span className="text-gray-500">{book.email}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium">{book.eventType}</td>
                        <td className="p-4">{book.date}</td>
                        <td className="p-4">{book.location}</td>
                        <td className="p-4 text-[#D4AF37] font-semibold">{book.budget || 'TBD'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase border ${
                            book.status === 'Confirmed' || book.status === 'Shoot Completed' || book.status === 'Delivered' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                            book.status === 'Cancelled' ? 'border-red-500/30 text-red-400 bg-red-500/5' :
                            book.status === 'New' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                            'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'
                          }`}>
                            {book.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 text-[10px]">{new Date(book.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedBookingDetails(book)}
                              className="p-1.5 bg-white/5 hover:bg-[#D4AF37]/15 border border-white/5 hover:border-[#D4AF37]/35 text-gray-400 hover:text-[#D4AF37] transition-all"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingBooking(book)}
                              className="p-1.5 bg-white/5 hover:bg-[#D4AF37]/15 border border-white/5 hover:border-[#D4AF37]/35 text-gray-400 hover:text-[#D4AF37] transition-all"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleGenerateInvoiceFromBooking(book)}
                              className="p-1.5 bg-white/5 hover:bg-green-600/10 border border-white/5 hover:border-green-500/30 text-gray-400 hover:text-green-400 transition-all"
                              title="Generate Quotation / Invoice"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleQuickStatus(book.id, 'Confirmed')}
                              className="p-1.5 bg-white/5 hover:bg-green-600/15 border border-white/5 hover:border-green-500/30 text-gray-400 hover:text-green-400 transition-all"
                              title="Mark Confirmed"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleQuickStatus(book.id, 'Shoot Completed')}
                              className="p-1.5 bg-white/5 hover:bg-green-600/15 border border-white/5 hover:border-green-500/30 text-gray-400 hover:text-green-400 transition-all"
                              title="Mark Completed"
                            >
                              <CheckSquare className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleBookingDelete(book.id)}
                              className="p-1.5 bg-white/5 hover:bg-red-600/15 border border-white/5 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-10 text-center text-gray-500">No matching bookings logs.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Portfolio CMS */}
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Add Portfolio form */}
            <div className="lg:col-span-5 p-8 border border-white/5 bg-[#0a0a0a] flex flex-col gap-6">
              <h3 className="font-serif text-xl text-[#D4AF37] flex items-center gap-2">
                <Plus className="h-5 w-5" /> Add Project Post
              </h3>
              <form onSubmit={handleAddPortfolio} className="flex flex-col gap-4 font-sans text-xs">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-port-title" className="text-gray-400 uppercase tracking-widest text-[9px]">Project Title</label>
                  <input
                    id="admin-port-title"
                    type="text"
                    required
                    value={newPort.title}
                    onChange={(e) => setNewPort({ ...newPort, title: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-port-client" className="text-gray-400 uppercase tracking-widest text-[9px]">Client</label>
                    <input
                      id="admin-port-client"
                      type="text"
                      required
                      value={newPort.client}
                      onChange={(e) => setNewPort({ ...newPort, client: e.target.value })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-port-cat" className="text-gray-400 uppercase tracking-widest text-[9px]">Category</label>
                    <select
                      id="admin-port-cat"
                      value={newPort.category}
                      onChange={(e) => setNewPort({ ...newPort, category: e.target.value })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Weddings">Weddings</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Government">Government</option>
                      <option value="Pre Wedding">Pre Wedding</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-port-loc" className="text-gray-400 uppercase tracking-widest text-[9px]">Location</label>
                    <input
                      id="admin-port-loc"
                      type="text"
                      required
                      value={newPort.location}
                      onChange={(e) => setNewPort({ ...newPort, location: e.target.value })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-port-date" className="text-gray-400 uppercase tracking-widest text-[9px]">Release Date</label>
                    <input
                      id="admin-port-date"
                      type="text"
                      required
                      placeholder="e.g. October 2025"
                      value={newPort.date}
                      onChange={(e) => setNewPort({ ...newPort, date: e.target.value })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-port-img" className="text-gray-400 uppercase tracking-widest text-[9px]">Image URL</label>
                  <input
                    id="admin-port-img"
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={newPort.image}
                    onChange={(e) => setNewPort({ ...newPort, image: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-port-video" className="text-gray-400 uppercase tracking-widest text-[9px]">Video URL (Optional)</label>
                  <input
                    id="admin-port-video"
                    type="url"
                    placeholder="https://assets.mixkit.co/..."
                    value={newPort.videoUrl}
                    onChange={(e) => setNewPort({ ...newPort, videoUrl: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-port-details" className="text-gray-400 uppercase tracking-widest text-[9px]">Narrative Details</label>
                  <textarea
                    id="admin-port-details"
                    rows={4}
                    required
                    value={newPort.details}
                    onChange={(e) => setNewPort({ ...newPort, details: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all"
                >
                  Create Project
                </button>
              </form>
            </div>

            {/* List and manage portfolio posts */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <h3 className="font-serif text-xl text-white">Active Projects ({portfolio.length})</h3>
              <div className="flex flex-col gap-4">
                {portfolio.map((item) => (
                  <div key={item.id} className="p-4 bg-[#0a0a0a] border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-14 w-14 object-cover border border-white/10 shrink-0"
                      />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold">{item.category}</span>
                        <h4 className="text-sm font-serif font-medium text-white">{item.title}</h4>
                        <span className="text-[10px] text-gray-500">{item.client} &bull; {item.location}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePortfolio(item.id)}
                      className="p-2 border border-white/5 hover:border-red-500/20 text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Gallery CMS */}
        {activeTab === 'gallery' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Add Gallery Item form */}
            <div className="lg:col-span-5 p-8 border border-white/5 bg-[#0a0a0a] flex flex-col gap-6">
              <h3 className="font-serif text-xl text-[#D4AF37] flex items-center gap-2">
                <Plus className="h-5 w-5" /> Add Gallery Asset
              </h3>
              <form onSubmit={handleAddGallery} className="flex flex-col gap-4 font-sans text-xs">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-gal-title" className="text-gray-400 uppercase tracking-widest text-[9px]">Asset Title</label>
                  <input
                    id="admin-gal-title"
                    type="text"
                    required
                    value={newGal.title}
                    onChange={(e) => setNewGal({ ...newGal, title: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-gal-cat" className="text-gray-400 uppercase tracking-widest text-[9px]">Category</label>
                    <select
                      id="admin-gal-cat"
                      value={newGal.category}
                      onChange={(e) => setNewGal({ ...newGal, category: e.target.value })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Weddings">Weddings</option>
                      <option value="Drone">Drone</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-gal-type" className="text-gray-400 uppercase tracking-widest text-[9px]">Media Type</label>
                    <select
                      id="admin-gal-type"
                      value={newGal.type}
                      onChange={(e) => setNewGal({ ...newGal, type: e.target.value as any })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none cursor-pointer"
                    >
                      <option value="image">Image File</option>
                      <option value="drone">Drone Reel</option>
                      <option value="video">Widescreen Video</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-gal-src" className="text-gray-400 uppercase tracking-widest text-[9px]">Source Image URL</label>
                  <input
                    id="admin-gal-src"
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={newGal.image}
                    onChange={(e) => setNewGal({ ...newGal, image: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                {newGal.type !== 'image' && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-gal-video" className="text-gray-400 uppercase tracking-widest text-[9px]">Video URL</label>
                    <input
                      id="admin-gal-video"
                      type="url"
                      required
                      placeholder="https://assets.mixkit.co/..."
                      value={newGal.videoUrl}
                      onChange={(e) => setNewGal({ ...newGal, videoUrl: e.target.value })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all"
                >
                  Add Media
                </button>
              </form>
            </div>

            {/* List and manage gallery */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <h3 className="font-serif text-xl text-white">Gallery Media ({gallery.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {gallery.map((item) => (
                  <div key={item.id} className="relative aspect-square overflow-hidden border border-white/5 group bg-[#0a0a0a]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#111111]/80 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-4 transition-opacity duration-300">
                      <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-semibold">{item.category}</span>
                      <button
                        onClick={() => handleDeleteGallery(item.id)}
                        className="p-1.5 bg-red-600 text-white self-end w-fit rounded-none"
                        title="Delete asset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Blogs CMS */}
        {activeTab === 'blogs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Add Blog Post form */}
            <div className="lg:col-span-6 p-8 border border-white/5 bg-[#0a0a0a] flex flex-col gap-6">
              <h3 className="font-serif text-xl text-[#D4AF37] flex items-center gap-2">
                <Plus className="h-5 w-5" /> Add Journal Article
              </h3>
              <form onSubmit={handleAddBlog} className="flex flex-col gap-4 font-sans text-xs">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-blog-title" className="text-gray-400 uppercase tracking-widest text-[9px]">Article Title</label>
                  <input
                    id="admin-blog-title"
                    type="text"
                    required
                    value={newBlog.title}
                    onChange={(e) => {
                      const slugStr = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setNewBlog({ ...newBlog, title: e.target.value, slug: slugStr });
                    }}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-blog-slug" className="text-gray-400 uppercase tracking-widest text-[9px]">URL Slug</label>
                    <input
                      id="admin-blog-slug"
                      type="text"
                      required
                      value={newBlog.slug}
                      onChange={(e) => setNewBlog({ ...newBlog, slug: e.target.value })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-blog-cat" className="text-gray-400 uppercase tracking-widest text-[9px]">Category</label>
                    <select
                      id="admin-blog-cat"
                      value={newBlog.category}
                      onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white cursor-pointer focus:outline-none"
                    >
                      <option value="Cinematography">Cinematography</option>
                      <option value="Weddings">Weddings</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Studio News">Studio News</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-blog-read" className="text-gray-400 uppercase tracking-widest text-[9px]">Read Duration</label>
                    <input
                      id="admin-blog-read"
                      type="text"
                      required
                      placeholder="e.g. 5 min"
                      value={newBlog.readTime}
                      onChange={(e) => setNewBlog({ ...newBlog, readTime: e.target.value })}
                      className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer self-end pb-3">
                    <input
                      type="checkbox"
                      checked={newBlog.isFeatured}
                      onChange={(e) => setNewBlog({ ...newBlog, isFeatured: e.target.checked })}
                      className="accent-[#D4AF37] h-4 w-4"
                    />
                    <span className="font-semibold text-white uppercase tracking-wider text-[9px]">Feature Article</span>
                  </label>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-blog-img" className="text-gray-400 uppercase tracking-widest text-[9px]">Banner Image URL</label>
                  <input
                    id="admin-blog-img"
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={newBlog.image}
                    onChange={(e) => setNewBlog({ ...newBlog, image: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-blog-sum" className="text-gray-400 uppercase tracking-widest text-[9px]">Summary Abstract</label>
                  <input
                    id="admin-blog-sum"
                    type="text"
                    required
                    value={newBlog.summary}
                    onChange={(e) => setNewBlog({ ...newBlog, summary: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-blog-body" className="text-gray-400 uppercase tracking-widest text-[9px]">Article Body (Use double newline for paragraphs)</label>
                  <textarea
                    id="admin-blog-body"
                    rows={8}
                    required
                    value={newBlog.content}
                    onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all"
                >
                  Publish Article
                </button>
              </form>
            </div>

            {/* List and manage blogs */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <h3 className="font-serif text-xl text-white">Active Articles ({blogs.length})</h3>
              <div className="flex flex-col gap-4">
                {blogs.map((item) => (
                  <div key={item.id} className="p-4 bg-[#0a0a0a] border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-14 w-20 object-cover border border-white/10 shrink-0"
                      />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold">{item.category}</span>
                          {item.isFeatured && <span className="text-[8px] bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-1.5 font-bold uppercase tracking-widest">Featured</span>}
                        </div>
                        <h4 className="text-xs font-serif font-medium text-white line-clamp-1">{item.title}</h4>
                        <span className="text-[9px] text-gray-500">Read: {item.readTime}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBlog(item.id)}
                      className="p-2 border border-white/5 hover:border-red-500/20 text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Invoices CMS */}
        {activeTab === 'invoices' && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-white">Invoices & Billing CMS</h2>
                <p className="text-gray-400 mt-1">Generate dynamic invoices from bookings, handle receipts, track taxes and history logs.</p>
              </div>
              <button
                onClick={handleOpenNewInvoiceModal}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-none"
              >
                <Plus className="h-4 w-4" /> Generate Invoice
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-[#0a0a0a] border border-white/5 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search invoice number or client name..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none text-xs w-64 animate-all"
                />
                <select
                  value={invoiceFilterStatus}
                  onChange={(e) => setInvoiceFilterStatus(e.target.value)}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none text-xs cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Total Billed: ₹{invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Invoices list table */}
            <div className="p-6 border border-white/5 bg-[#0a0a0a]">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider text-[9px]">
                      <th className="py-2.5">Invoice No</th>
                      <th className="py-2.5">Client & Inquiry</th>
                      <th className="py-2.5">Dates</th>
                      <th className="py-2.5">Amounts</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-400 font-light">
                    {invoices
                      .filter((inv) => {
                        const clientName = inv.clientName || '';
                        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
                          clientName.toLowerCase().includes(invoiceSearch.toLowerCase());
                        const matchesStatus = invoiceFilterStatus === 'all' || inv.status === invoiceFilterStatus;
                        return matchesSearch && matchesStatus;
                      })
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-white/[0.01]">
                          <td className="py-4 text-white font-semibold flex items-center gap-1.5">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-4">
                            <span className="font-medium text-white block">{inv.clientName}</span>
                            <span className="text-[9px] text-gray-600 block">{inv.clientEmail}</span>
                          </td>
                          <td className="py-4">
                            <span className="block">Issued: {inv.issueDate}</span>
                            <span className="text-gray-500 block">Due: {inv.dueDate}</span>
                          </td>
                          <td className="py-4">
                            <span className="block">Total: ₹{inv.total.toLocaleString('en-IN')}</span>
                            <span className="text-yellow-400 block font-medium">Due: ₹{inv.balanceAmount.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 text-[8px] font-semibold tracking-wider uppercase border ${
                              inv.status === 'Paid' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                              inv.status === 'Draft' ? 'border-gray-500/30 text-gray-400 bg-gray-500/5' :
                              inv.status === 'Cancelled' ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex gap-2 justify-end items-center">
                              {/* Print / Preview */}
                              <a
                                href={`/invoices/${inv.invoiceNumber}.pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 border border-white/5 hover:border-white text-gray-400 hover:text-white"
                                title="Download / Open PDF"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              
                              <button
                                onClick={() => handleSendInvoice(inv.id)}
                                className="p-1.5 border border-white/5 hover:border-white text-gray-400 hover:text-white"
                                title="Email PDF Invoice to Client"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEditInvoiceModal(inv)}
                                className="p-1.5 border border-white/5 hover:border-white text-gray-300 hover:text-white"
                                title="Edit items & Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDuplicateInvoice(inv.id)}
                                className="p-1.5 border border-white/5 hover:border-white text-gray-400 hover:text-white"
                                title="Clone / Duplicate Invoice"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>

                              {/* Pay / Mark Status */}
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleQuickMarkPaid(inv)}
                                  className="px-1.5 py-1 bg-green-900/40 text-green-400 hover:bg-green-800/40 border border-green-700/30 text-[8px] uppercase font-bold"
                                  title="Mark 100% Paid"
                                >
                                  Paid
                                </button>
                                <button
                                  onClick={() => handleQuickMarkPartial(inv)}
                                  className="px-1.5 py-1 bg-yellow-900/40 text-yellow-400 hover:bg-yellow-800/40 border border-yellow-700/30 text-[8px] uppercase font-bold"
                                  title="Record partial payment"
                                >
                                  Part
                                </button>
                              </div>

                              <button
                                onClick={() => handleOpenHistoryModal(inv)}
                                className="p-1.5 border border-white/5 hover:border-white text-gray-400 hover:text-white"
                                title="View History Logs"
                              >
                                <History className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 border border-white/5 hover:border-red-500/30 text-gray-500 hover:text-red-400 hover:bg-red-500/5"
                                title="Delete Invoice"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* GENERATE / EDIT INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
          <form onSubmit={handleInvoiceSubmit} className="bg-[#0a0a0a] border border-[#D4AF37]/30 max-w-4xl w-full p-8 font-sans text-xs relative my-8 text-white">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-lg text-white mb-6">
              {invoiceForm.id ? 'Edit Billing Invoice Details' : 'Generate Dynamic Billing Invoice'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-widest text-[8px]">Invoice Number</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-widest text-[8px]">Link Approved Inquiry / Booking</label>
                <select
                  value={invoiceForm.bookingId}
                  onChange={(e) => {
                    const bid = e.target.value;
                    const booking = bookings.find(b => b.id === bid);
                    if (booking) {
                      const client = clients.find(c => c.email.trim().toLowerCase() === booking.email.trim().toLowerCase());
                      setInvoiceForm({
                        ...invoiceForm,
                        bookingId: bid,
                        clientId: client ? client.id : '',
                        items: [{
                          serviceName: booking.eventType,
                          description: `Custom package service for booking date: ${booking.date} at ${booking.location}`,
                          quantity: 1,
                          price: Number(booking.budget?.replace(/[^0-9]/g, '') || 0),
                          tax: 0,
                          total: Number(booking.budget?.replace(/[^0-9]/g, '') || 0)
                        }]
                      });
                    } else {
                      setInvoiceForm({ ...invoiceForm, bookingId: bid });
                    }
                  }}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Inquiry Booking --</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - {b.eventType} ({b.date})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-widest text-[8px]">Client Account Profile</label>
                <select
                  value={invoiceForm.clientId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choose Client Profile --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
                <span className="text-[7.5px] text-gray-500 uppercase tracking-normal">Note: Leave blank to auto-create client profile from selected Booking!</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-widest text-[8px]">Issue Date</label>
                <input
                  type="date"
                  required
                  value={invoiceForm.issueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-widest text-[8px]">Due Date</label>
                <input
                  type="date"
                  required
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-widest text-[8px]">Invoice Status</label>
                <select
                  value={invoiceForm.status}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none cursor-pointer"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-widest text-[8px]">Advance Paid Amount (₹)</label>
                <input
                  type="number"
                  value={invoiceForm.paidAmount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, paidAmount: Number(e.target.value) })}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Item Table Grid */}
            <div className="mb-6">
              <span className="text-gray-400 uppercase tracking-widest text-[8px] block mb-2 font-semibold">Itemized service breakdown</span>
              <div className="flex flex-col gap-3">
                {invoiceForm.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start bg-[#111111] p-4 border border-white/5 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveInvoiceItemRow(idx)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                    
                    <div className="flex-1 w-full flex flex-col gap-1.5">
                      <label className="text-[7.5px] uppercase tracking-widest text-gray-500">Service Title</label>
                      <input
                        type="text"
                        required
                        value={item.serviceName}
                        onChange={(e) => handleInvoiceItemChange(idx, 'serviceName', e.target.value)}
                        placeholder="e.g. Traditional Photography"
                        className="bg-[#0a0a0a] border border-white/10 px-3 py-1.5 text-white focus:outline-none w-full"
                      />
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-1.5">
                      <label className="text-[7.5px] uppercase tracking-widest text-gray-500">Service Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleInvoiceItemChange(idx, 'description', e.target.value)}
                        placeholder="e.g. Candid coverages and album design deliverables"
                        className="bg-[#0a0a0a] border border-white/10 px-3 py-1.5 text-white focus:outline-none w-full"
                      />
                    </div>

                    <div className="w-16 flex flex-col gap-1.5">
                      <label className="text-[7.5px] uppercase tracking-widest text-gray-500">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleInvoiceItemChange(idx, 'quantity', Number(e.target.value))}
                        className="bg-[#0a0a0a] border border-white/10 px-3 py-1.5 text-white focus:outline-none w-full text-center"
                      />
                    </div>

                    <div className="w-32 flex flex-col gap-1.5">
                      <label className="text-[7.5px] uppercase tracking-widest text-gray-500">Unit Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={item.price}
                        onChange={(e) => handleInvoiceItemChange(idx, 'price', Number(e.target.value))}
                        className="bg-[#0a0a0a] border border-white/10 px-3 py-1.5 text-white focus:outline-none w-full text-right"
                      />
                    </div>

                    <div className="w-24 text-right self-end pb-3 shrink-0">
                      <span className="text-[8px] text-gray-500 block">Total</span>
                      <span className="text-white font-semibold font-mono">₹{item.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddInvoiceItemRow}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 text-gray-400 hover:text-white uppercase tracking-wider text-[9px] rounded-none"
                >
                  + Add Line Item Row
                </button>
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-5 mb-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-widest text-[8px]">Invoice Summary Notes / T&C</label>
                  <textarea
                    rows={4}
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="bg-[#111111] p-5 border border-white/5 flex flex-col gap-3.5 text-white">
                <div className="flex justify-between">
                  <span className="text-gray-500">Items Subtotal:</span>
                  <span className="font-semibold text-white">
                    ₹{invoiceForm.items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[7.5px] uppercase tracking-widest text-gray-500">Add Tax (GST ₹)</label>
                    <input
                      type="number"
                      value={invoiceForm.tax}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: Number(e.target.value) })}
                      className="bg-[#0a0a0a] border border-white/10 px-3 py-1 text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[7.5px] uppercase tracking-widest text-gray-500">Add Discount (₹)</label>
                    <input
                      type="number"
                      value={invoiceForm.discount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: Number(e.target.value) })}
                      className="bg-[#0a0a0a] border border-white/10 px-3 py-1 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="h-[1px] bg-white/5 w-full my-1" />
                
                {(() => {
                  const subtotal = invoiceForm.items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
                  const total = subtotal + invoiceForm.tax - invoiceForm.discount;
                  const balance = Math.max(0, total - invoiceForm.paidAmount);
                  return (
                    <>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-gray-300">Grand Total:</span>
                        <span className="text-[#D4AF37]">₹{total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Balance Due:</span>
                        <span className="text-yellow-400">₹{balance.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-5 py-2.5 border border-white/10 hover:border-white text-gray-400 hover:text-white uppercase tracking-wider transition-all rounded-none"
              >
                Close Editor
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all rounded-none"
              >
                {actionLoading ? 'Compiling PDF & Notifying...' : invoiceForm.id ? 'Save Invoice Updates' : 'Generate & Send Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW HISTORY LOGS MODAL */}
      {isHistoryModalOpen && historyInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 max-w-lg w-full p-8 relative font-sans text-xs flex flex-col gap-6 text-white">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="font-serif text-lg text-white">Invoice History Log</h3>
              <p className="text-gray-500 mt-1 uppercase tracking-widest text-[9px]">Invoice: {historyInvoice.invoiceNumber}</p>
            </div>

            <div className="flex flex-col gap-4 border-l border-white/10 pl-5 ml-2.5 max-h-[300px] overflow-y-auto">
              {historyInvoice.history && historyInvoice.history.map((log: any, idx: number) => (
                <div key={idx} className="relative flex flex-col gap-1.5">
                  <div className="absolute -left-[25px] top-0.5 h-2.5 w-2.5 rounded-full bg-[#D4AF37] border-2 border-[#0a0a0a]" />
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-white uppercase tracking-wider">{log.action}</span>
                    <span className="text-gray-600 font-sans">{new Date(log.date).toLocaleString()}</span>
                  </div>
                  {log.notes && (
                    <p className="text-gray-400 font-light font-sans">{log.notes}</p>
                  )}
                </div>
              ))}
              {(!historyInvoice.history || historyInvoice.history.length === 0) && (
                <p className="text-gray-500 py-4 text-center">No history logs recorded for this invoice.</p>
              )}
            </div>

            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="py-2.5 bg-white/5 hover:bg-white/10 text-white uppercase tracking-wider font-semibold rounded-none"
            >
              Close History Logs
            </button>
          </div>
        </div>
      )}

        {/* Tab 6: Global Settings CMS */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl border border-white/5 bg-[#0a0a0a] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl" />
            <h3 className="font-serif text-xl text-[#D4AF37] mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5" /> Global System Settings
            </h3>
            
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-6 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-biz-name" className="text-gray-400 uppercase tracking-widest text-[9px]">Business Name</label>
                  <input
                    id="settings-biz-name"
                    type="text"
                    required
                    value={siteSettings.businessName || ''}
                    onChange={(e) => handleSettingsFieldChange('businessName', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-founder" className="text-gray-400 uppercase tracking-widest text-[9px]">Founder Name</label>
                  <input
                    id="settings-founder"
                    type="text"
                    required
                    value={siteSettings.founderName || ''}
                    onChange={(e) => handleSettingsFieldChange('founderName', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-founder-image" className="text-gray-400 uppercase tracking-widest text-[9px]">Founder Image URL</label>
                  <input
                    id="settings-founder-image"
                    type="url"
                    value={siteSettings.founderImage || ''}
                    onChange={(e) => handleSettingsFieldChange('founderImage', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-phone" className="text-gray-400 uppercase tracking-widest text-[9px]">Phone contact</label>
                  <input
                    id="settings-phone"
                    type="text"
                    required
                    value={siteSettings.phone || ''}
                    onChange={(e) => handleSettingsFieldChange('phone', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-email" className="text-gray-400 uppercase tracking-widest text-[9px]">Email contact</label>
                  <input
                    id="settings-email"
                    type="email"
                    required
                    value={siteSettings.email || ''}
                    onChange={(e) => handleSettingsFieldChange('email', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-exp" className="text-gray-400 uppercase tracking-widest text-[9px]">Experience Timeline (Years)</label>
                  <input
                    id="settings-exp"
                    type="number"
                    required
                    value={siteSettings.experienceYears || 0}
                    onChange={(e) => handleSettingsFieldChange('experienceYears', Number(e.target.value))}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="settings-logo" className="text-gray-400 uppercase tracking-widest text-[9px]">Logo Image URL</label>
                <input
                  id="settings-logo"
                  type="url"
                  required
                  value={siteSettings.logoUrl || ''}
                  onChange={(e) => handleSettingsFieldChange('logoUrl', e.target.value)}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="settings-loc" className="text-gray-400 uppercase tracking-widest text-[9px]">Base Location</label>
                <input
                  id="settings-loc"
                  type="text"
                  required
                  value={siteSettings.location || ''}
                  onChange={(e) => handleSettingsFieldChange('location', e.target.value)}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="h-[1px] bg-white/5 w-full my-2" />
              <h4 className="font-serif text-sm text-[#D4AF37] uppercase tracking-wider">Payment & Tax Configuration</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-bank-name" className="text-gray-400 uppercase tracking-widest text-[9px]">Bank Name</label>
                  <input
                    id="settings-bank-name"
                    type="text"
                    value={siteSettings.bankName || ''}
                    onChange={(e) => handleSettingsFieldChange('bankName', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-ac-number" className="text-gray-400 uppercase tracking-widest text-[9px]">Bank Account Number</label>
                  <input
                    id="settings-ac-number"
                    type="text"
                    value={siteSettings.accountNumber || ''}
                    onChange={(e) => handleSettingsFieldChange('accountNumber', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. 50100234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-ifsc" className="text-gray-400 uppercase tracking-widest text-[9px]">IFSC Code</label>
                  <input
                    id="settings-ifsc"
                    type="text"
                    value={siteSettings.ifscCode || ''}
                    onChange={(e) => handleSettingsFieldChange('ifscCode', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. HDFC0000123"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-upi" className="text-gray-400 uppercase tracking-widest text-[9px]">UPI ID</label>
                  <input
                    id="settings-upi"
                    type="text"
                    value={siteSettings.upiId || ''}
                    onChange={(e) => handleSettingsFieldChange('upiId', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. dopdasari@okaxis"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-gst" className="text-gray-400 uppercase tracking-widest text-[9px]">GST Number (Optional)</label>
                  <input
                    id="settings-gst"
                    type="text"
                    value={siteSettings.gstNumber || ''}
                    onChange={(e) => handleSettingsFieldChange('gstNumber', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. 36AAAAA1111A1Z1"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-pan" className="text-gray-400 uppercase tracking-widest text-[9px]">PAN Number (Optional)</label>
                  <input
                    id="settings-pan"
                    type="text"
                    value={siteSettings.panNumber || ''}
                    onChange={(e) => handleSettingsFieldChange('panNumber', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. ABCDE1234F"
                  />
                </div>
              </div>

              <div className="h-[1px] bg-white/5 w-full my-2" />

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" /> Save Global Configuration
                </button>
                {saveStatus && (
                  <p className="text-[11px] text-center text-[#D4AF37]">{saveStatus}</p>
                )}
              </div>
            </form>
          </div>
        )}
      {/* VIEW BOOKING DETAILS MODAL */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 max-w-4xl w-full p-8 relative font-sans text-xs flex flex-col gap-6 text-white max-h-[90vh] overflow-y-auto rounded-none">
            <button
              onClick={() => setSelectedBookingDetails(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-2xl text-white">Booking Details</h3>
                <span className="font-mono text-xs text-[#D4AF37] tracking-widest">{selectedBookingDetails.id}</span>
              </div>
              <span className={`px-3 py-1 text-[10px] font-semibold tracking-wider uppercase border ${
                selectedBookingDetails.status === 'Confirmed' || selectedBookingDetails.status === 'Shoot Completed' ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'
              }`}>
                Status: {selectedBookingDetails.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Client & Booking Information */}
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold mb-3">Client Information</h4>
                  <div className="p-4 bg-[#111111] border border-white/5 flex flex-col gap-2.5">
                    <p><strong>Name:</strong> {selectedBookingDetails.name}</p>
                    <p><strong>Email:</strong> {selectedBookingDetails.email}</p>
                    <p><strong>Phone:</strong> {selectedBookingDetails.phone}</p>
                    <p>
                      <strong>Access Key:</strong>{' '}
                      <span className="font-mono text-[#D4AF37] bg-white/5 px-2 py-0.5">
                        {clients.find(c => c.email.toLowerCase() === selectedBookingDetails.email.toLowerCase())?.accessKey || 'None'}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold mb-3">Booking Information</h4>
                  <div className="p-4 bg-[#111111] border border-white/5 flex flex-col gap-2.5">
                    <p><strong>Event Type:</strong> {selectedBookingDetails.eventType}</p>
                    <p><strong>Proposed Date:</strong> {selectedBookingDetails.date}</p>
                    <p><strong>Location:</strong> {selectedBookingDetails.location}</p>
                    <p><strong>Budget:</strong> <span className="text-[#D4AF37] font-bold">{selectedBookingDetails.budget || 'TBD'}</span></p>
                    <p><strong>Assigned Team:</strong> {selectedBookingDetails.assignedTeam || 'None Assigned'}</p>
                    <p className="border-t border-white/5 pt-2 mt-2 text-gray-400 leading-relaxed font-light">
                      <strong>Client Note:</strong> {selectedBookingDetails.message || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Invoices, Payments, Notes, Timeline */}
              <div className="flex flex-col gap-6">
                {/* Notes and Team Assignment */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold mb-3">Internal Admin CRM Notes</h4>
                  <div className="flex flex-col gap-3">
                    <textarea
                      defaultValue={selectedBookingDetails.notes || ''}
                      placeholder="Add internal CRM notes here..."
                      id={`notes-textarea-${selectedBookingDetails.id}`}
                      rows={3}
                      className="w-full bg-[#111111] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-sans"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={selectedBookingDetails.assignedTeam || ''}
                        placeholder="Assign team / camera crew..."
                        id={`team-input-${selectedBookingDetails.id}`}
                        className="flex-1 bg-[#111111] border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none font-sans"
                      />
                      <button
                        onClick={() => {
                          const notesVal = (document.getElementById(`notes-textarea-${selectedBookingDetails.id}`) as HTMLTextAreaElement)?.value || '';
                          const teamVal = (document.getElementById(`team-input-${selectedBookingDetails.id}`) as HTMLInputElement)?.value || '';
                          handleUpdateBookingAll({
                            ...selectedBookingDetails,
                            notes: notesVal,
                            assignedTeam: teamVal
                          });
                        }}
                        className="px-4 py-1.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all font-sans"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linked Invoices & Payments */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold mb-3">Financial Records</h4>
                  <div className="p-4 bg-[#111111] border border-white/5 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Invoices</span>
                      {invoices.filter(i => i.bookingId === selectedBookingDetails.id || i.clientId === clients.find(c => c.email.toLowerCase() === selectedBookingDetails.email.toLowerCase())?.id).map(inv => (
                        <div key={inv.id} className="flex justify-between items-center text-[11px] border-b border-white/5 pb-1">
                          <span>{inv.invoiceNumber}</span>
                          <span className="text-[#D4AF37] font-semibold">{inv.total.toLocaleString()} INR ({inv.status})</span>
                        </div>
                      ))}
                      {invoices.filter(i => i.bookingId === selectedBookingDetails.id).length === 0 && (
                        <span className="text-gray-500 italic text-[11px]">No invoices linked.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold mb-3">Timeline</h4>
                  <div className="flex flex-col gap-2 p-4 bg-[#111111] border border-white/5">
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>Submitted</span>
                      <span>{new Date(selectedBookingDetails.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>Last Updated</span>
                      <span>{new Date(selectedBookingDetails.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-2">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="px-5 py-2 border border-white/10 hover:border-white text-gray-400 hover:text-white uppercase tracking-wider transition-all font-sans"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 max-w-lg w-full p-8 relative font-sans text-xs flex flex-col gap-6 text-white rounded-none">
            <button
              onClick={() => setEditingBooking(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div>
              <h3 className="font-serif text-xl text-white">Edit Booking</h3>
              <p className="text-gray-500 mt-1 uppercase tracking-widest text-[9px]">ID: {editingBooking.id}</p>
            </div>

            <form onSubmit={handleUpdateBookingAll} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Client Name</label>
                <input
                  type="text"
                  value={editingBooking.name || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Email</label>
                  <input
                    type="email"
                    value={editingBooking.email || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Phone</label>
                  <input
                    type="text"
                    value={editingBooking.phone || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Event Date</label>
                  <input
                    type="text"
                    value={editingBooking.date || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Location</label>
                  <input
                    type="text"
                    value={editingBooking.location || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, location: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Event Type</label>
                  <input
                    type="text"
                    value={editingBooking.eventType || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, eventType: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Budget</label>
                  <input
                    type="text"
                    value={editingBooking.budget || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, budget: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Status</label>
                  <select
                    value={editingBooking.status || 'New'}
                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value })}
                    className="bg-[#111111] border border-[#D4AF37]/35 px-3 py-2 text-xs text-white bg-[#0a0a0a] focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Quotation Sent">Quotation Sent</option>
                    <option value="Advance Paid">Advance Paid</option>
                    <option value="Shoot Scheduled">Shoot Scheduled</option>
                    <option value="Shoot Completed">Shoot Completed</option>
                    <option value="Editing">Editing</option>
                    <option value="Gallery Ready">Gallery Ready</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Assigned Team</label>
                  <input
                    type="text"
                    value={editingBooking.assignedTeam || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, assignedTeam: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    placeholder="e.g. Lead Camera A"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 border border-white/10 text-gray-400 hover:text-white uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
      
      {/* Footer modals / old settings markup */}
    </div>
  );
}
