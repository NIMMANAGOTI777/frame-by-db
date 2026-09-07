'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Lock, LayoutDashboard, Calendar, Camera, Images, FileText, Settings, 
  LogOut, CheckCircle2, XCircle, Trash2, Plus, Save, Award,
  CreditCard, Copy, Printer, Share2, Send, History, ExternalLink, RefreshCw, Eye, X,
  Bell, Edit2, CheckSquare, Check, AlertCircle, ArrowUpRight, RotateCcw, DollarSign
} from 'lucide-react';
import { PAYMENT_DETAILS, BILLED_BY_DETAILS, PAYMENT_METHODS, computeInvoicePaymentStatus, formatPaymentStatusLabel } from '@/lib/constants/payment';
import { INVOICE_THEMES, INVOICE_THEME_LIST, getInvoiceTheme, type InvoiceTheme } from '@/lib/constants/invoiceThemes';

const DEFAULT_BILLED_BY = {
  name: 'Dasari Bharadwaj',
  addressLine1: '8-3-228/112/4A, Yousufguda, Hyderabad',
  addressLine2: 'Yousufguda',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  pinCode: '500045',
  pan: 'BZUPB1327D',
  email: 'dopdasari@gmail.com',
  phone: '+91 88850 60808'
};

const DEFAULT_BANK_DETAILS = {
  accountName: 'Dasari Bharadwaj',
  accountNumber: '36300863175',
  ifsc: 'SBIN0018857',
  accountType: 'Savings',
  bankName: 'State Bank',
  branch: 'Mudigubba'
};

const DEFAULT_UPI_DETAILS = {
  upiId: 'dasaribharadwaj@ybl',
  qrCodeUrl: 'https://res.cloudinary.com/do4nuj2kh/image/upload/v1788764321/cfd483f1-1d47-42dc-a45d-4984ec18bb57_ka98b0.png',
  upiInstruction: 'Scan to pay via UPI',
  upiNote: 'Maximum of 1 lakh can be transferred via upi in a single day.'
};

function generateInvoiceNumber(existingInvoices: any[] = []) {
  let maxNum = 56;
  existingInvoices.forEach(inv => {
    const m = inv.invoiceNumber?.match(/DB(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= maxNum) maxNum = n + 1;
    }
  });
  return `DB${String(maxNum).padStart(3, '0')}`;
}

function getDefaultDates() {
  const issueDate = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { issueDate, dueDate };
}

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
  const [adminPayments, setAdminPayments] = useState<any[]>([]);

  // Payment Management States
  const [recordPaymentInvoice, setRecordPaymentInvoice] = useState<any | null>(null);
  const [recordPaymentForm, setRecordPaymentForm] = useState<{
    amount: number | string;
    method: string;
    transactionId: string;
    paymentDate: string;
    notes: string;
  }>({
    amount: '',
    method: 'UPI',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [invoicePaymentsView, setInvoicePaymentsView] = useState<any | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment details could not be verified');

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
  
  const [isManualClient, setIsManualClient] = useState(false);
  const [createdInvoiceResult, setCreatedInvoiceResult] = useState<any | null>(null);
  const [downloadThemeModalInvoice, setDownloadThemeModalInvoice] = useState<any | null>(null);
  const [downloadThemeSelected, setDownloadThemeSelected] = useState<string>('purple');
  const [sendInvoiceModalInvoice, setSendInvoiceModalInvoice] = useState<any | null>(null);
  const [sendInvoiceThemeSelected, setSendInvoiceThemeSelected] = useState<string>('purple');
  const [showLivePreviewMobile, setShowLivePreviewMobile] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState<any>({
    id: '',
    invoiceNumber: '',
    issueDate: '',
    dueDate: '',
    createdBy: 'Dasari Bharadwaj',
    status: 'Draft',
    bookingId: '',
    clientId: '',
    clientMode: 'existing',
    billedBy: { ...DEFAULT_BILLED_BY },
    billedTo: {
      clientName: '',
      companyName: '',
      addressLine1: '',
      addressLine2: '',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pinCode: '500016',
      email: '',
      phone: '',
      gstin: '',
      pan: ''
    },
    items: [
      {
        serviceName: 'Equipment Rental & Cinematography Service',
        description: "Equipment Rental service on 24-June-2026 at KIM'S HOSPITAL Kondapur.\n\nFx 3 - 2\n50mm -1\nTripod -1\nND filter -1\nCamera asst -1\nLIGHTS\nNanlight 300 c-01\nAmaran f 22 x -01\nboomroad -02\nStool set up\nall grip equipment\nlight mans-2\nTransportation",
        gstRate: 18,
        quantity: 1,
        rate: 45000,
        price: 45000,
        amount: 45000,
        cgst: 4050,
        sgst: 4050,
        tax: 8100,
        total: 53100
      }
    ],
    discountType: 'none',
    discountValue: 0,
    discount: 0,
    subtotal: 45000,
    cgst: 4050,
    sgst: 4050,
    tax: 8100,
    total: 53100,
    paidAmount: 0,
    balanceAmount: 53100,
    paymentStatus: 'Pending',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    transactionId: '',
    bankDetails: { ...DEFAULT_BANK_DETAILS },
    upiId: DEFAULT_UPI_DETAILS.upiId,
    qrCodeUrl: DEFAULT_UPI_DETAILS.qrCodeUrl,
    upiInstruction: DEFAULT_UPI_DETAILS.upiInstruction,
    upiNote: DEFAULT_UPI_DETAILS.upiNote,
    signatureUrl: '',
    invoiceTheme: 'purple',
    notes: 'Thank you for choosing Frame by DB. Deliverables will be released post clearance of dues.',
    terms: 'Payment is due within 15 days of invoice date. Maximum of 1 lakh can be transferred via UPI in a single day.',
    sendEmail: false
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
      const [bookRes, portRes, galRes, blogRes, setRes, invRes, clRes, payRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/portfolio'),
        fetch('/api/gallery'),
        fetch('/api/blogs'),
        fetch('/api/settings'),
        fetch('/api/admin/invoices'),
        fetch('/api/admin/clients'),
        fetch('/api/admin/payments')
      ]);

      const [bookData, portData, galData, blogData, setData, invData, clData, payData] = await Promise.all([
        bookRes.json(),
        portRes.json(),
        galRes.json(),
        blogRes.json(),
        setRes.json(),
        invRes.ok ? invRes.json() : [],
        clRes.ok ? clRes.json() : [],
        payRes.ok ? payRes.json() : []
      ]);

      setBookings(bookData);
      setPortfolio(portData);
      setGallery(galData);
      setBlogs(blogData);
      setSiteSettings(setData);
      setInvoices(invData);
      setClients(clData);
      setAdminPayments(payData);
    } catch (err) {
      console.error('Failed to load admin panel data:', err);
    }
  }, []);

  // Dashboard Financial / Payment Overview Metrics
  const paymentMetrics = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (Number(inv.balanceAmount) || 0), 0);
    const totalPending = invoices
      .filter(inv => {
        const pStatus = inv.paymentStatus || computeInvoicePaymentStatus(inv);
        return pStatus === 'PENDING' || pStatus === 'PARTIALLY_PAID';
      })
      .reduce((sum, inv) => sum + (Number(inv.balanceAmount) || 0), 0);

    return { totalInvoiced, totalPaid, totalPending, totalOutstanding };
  }, [invoices]);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
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
    
    setIsManualClient(!client);
    setShowLivePreviewMobile(false);
    setCreatedInvoiceResult(null);

    const bookingBudget = typeof booking.budget === 'number' ? booking.budget : parseFloat(String(booking.budget || '').replace(/[^0-9.]/g, '')) || 0;

    const baseForm = {
      id: '',
      invoiceNumber: generateInvoiceNumber(invoices),
      bookingId: booking.id,
      clientId: client ? client.id : '',
      issueDate: getDefaultDates().issueDate,
      dueDate: getDefaultDates().dueDate,
      createdBy: 'Dasari Bharadwaj',
      status: 'Draft',
      billedBy: { ...DEFAULT_BILLED_BY },
      billedTo: {
        clientName: client?.name || booking.name || '',
        companyName: client?.companyName || '',
        addressLine1: client?.billingAddress || client?.location || booking.location || '',
        addressLine2: '',
        city: client?.city || 'Hyderabad',
        state: client?.state || 'Telangana',
        country: 'India',
        pinCode: client?.pinCode || '500016',
        email: client?.email || booking.email || '',
        phone: client?.phone || booking.phone || '',
        gstin: client?.gstin || client?.gstNumber || '',
        pan: ''
      },
      items: [{
        serviceName: booking.eventType || 'Cinematography Service',
        description: `Event Location: ${booking.location || 'Hyderabad'}. Date: ${booking.date || 'TBD'}`,
        quantity: 1,
        rate: bookingBudget,
        price: bookingBudget,
        amount: bookingBudget,
        gstRate: 0,
        cgst: 0,
        sgst: 0,
        tax: 0,
        total: bookingBudget
      }],
      discountType: 'none',
      discountValue: 0,
      discount: 0,
      subtotal: bookingBudget,
      cgst: 0,
      sgst: 0,
      tax: 0,
      total: bookingBudget,
      paidAmount: 0,
      balanceAmount: bookingBudget,
      paymentStatus: 'Pending',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      transactionId: '',
      bankDetails: { ...DEFAULT_BANK_DETAILS },
      upiId: DEFAULT_UPI_DETAILS.upiId,
      qrCodeUrl: DEFAULT_UPI_DETAILS.qrCodeUrl,
      upiInstruction: DEFAULT_UPI_DETAILS.upiInstruction,
      upiNote: DEFAULT_UPI_DETAILS.upiNote,
      signatureUrl: '',
      invoiceTheme: 'purple',
      notes: `Quotation generated for Booking #${booking.id}`,
      terms: '1. 50% advance to confirm booking.\n2. Balance due on delivery of final assets.\n3. GST applicable as per government regulations.',
      sendEmail: false
    };

    setInvoiceForm(baseForm);
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
        const data = await res.json();
        document.cookie = `admin_token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
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
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
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

  // Invoice Action Handlers & Calculations
  const recalculateAndSetForm = (
    items: any[],
    discountType: string = invoiceForm.discountType,
    discountValue: number = invoiceForm.discountValue,
    paidAmount: number = invoiceForm.paidAmount,
    extraUpdates: any = {}
  ) => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    const cgst = items.reduce((sum, it) => sum + (Number(it.cgst) || 0), 0);
    const sgst = items.reduce((sum, it) => sum + (Number(it.sgst) || 0), 0);
    const tax = cgst + sgst;

    let discount = 0;
    const dVal = Number(discountValue) || 0;
    if (discountType === 'percentage') {
      discount = (subtotal * dVal) / 100;
    } else if (discountType === 'fixed') {
      discount = dVal;
    }
    discount = Math.min(discount, subtotal + tax);

    const total = Math.max(0, subtotal + tax - discount);
    const paid = Math.max(0, Number(paidAmount) || 0);
    const balanceAmount = Math.max(0, total - paid);

    let paymentStatus = invoiceForm.paymentStatus || 'Pending';
    if (balanceAmount === 0 && total > 0) {
      paymentStatus = 'Paid';
    } else if (paid > 0) {
      paymentStatus = 'Partially Paid';
    } else {
      paymentStatus = 'Pending';
    }

    setInvoiceForm((prev: any) => ({
      ...prev,
      items,
      subtotal,
      cgst,
      sgst,
      tax,
      discountType,
      discountValue: dVal,
      discount,
      total,
      paidAmount: paid,
      balanceAmount,
      paymentStatus,
      ...extraUpdates
    }));
  };

  const handleOpenNewInvoiceModal = () => {
    const invoiceNum = generateInvoiceNumber(invoices);
    const { issueDate: today, dueDate: due } = getDefaultDates();
    
    setIsManualClient(false);
    setCreatedInvoiceResult(null);

    const initialItems = [
      {
        serviceName: 'Equipment Rental & Cinematography Service',
        description: "Equipment Rental service on 24-June-2026 at KIM'S HOSPITAL Kondapur.\n\nFx 3 - 2\n50mm -1\nTripod -1\nND filter -1\nCamera asst -1\nLIGHTS\nNanlight 300 c-01\nAmaran f 22 x -01\nboomroad -02\nStool set up\nall grip equipment\nlight mans-2\nTransportation",
        gstRate: 18,
        quantity: 1,
        rate: 45000,
        price: 45000,
        amount: 45000,
        cgst: 4050,
        sgst: 4050,
        tax: 8100,
        total: 53100
      }
    ];

    setInvoiceForm({
      id: '',
      invoiceNumber: invoiceNum,
      issueDate: today,
      dueDate: due,
      createdBy: 'Dasari Bharadwaj',
      status: 'Draft',
      bookingId: '',
      clientId: '',
      clientMode: 'existing',
      billedBy: { ...DEFAULT_BILLED_BY },
      billedTo: {
        clientName: '',
        companyName: '',
        addressLine1: '',
        addressLine2: '',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        pinCode: '500016',
        email: '',
        phone: '',
        gstin: '',
        pan: ''
      },
      items: initialItems,
      discountType: 'none',
      discountValue: 0,
      discount: 0,
      subtotal: 45000,
      cgst: 4050,
      sgst: 4050,
      tax: 8100,
      total: 53100,
      paidAmount: 0,
      balanceAmount: 53100,
      paymentStatus: 'Pending',
      paymentDate: today,
      paymentMethod: 'UPI',
      transactionId: '',
      bankDetails: { ...DEFAULT_BANK_DETAILS },
      upiId: DEFAULT_UPI_DETAILS.upiId,
      qrCodeUrl: DEFAULT_UPI_DETAILS.qrCodeUrl,
      upiInstruction: DEFAULT_UPI_DETAILS.upiInstruction,
      upiNote: DEFAULT_UPI_DETAILS.upiNote,
      signatureUrl: '',
      invoiceTheme: 'purple',
      notes: 'Thank you for choosing Frame by DB. Deliverables will be released post clearance of dues.',
      terms: 'Payment is due within 15 days of invoice date. Maximum of 1 lakh can be transferred via UPI in a single day.',
      sendEmail: false
    });
    setIsInvoiceModalOpen(true);
  };

  const handleOpenEditInvoiceModal = (inv: any) => {
    setCreatedInvoiceResult(null);

    const clientObj = inv.clientId || {};
    const parsedItems = (inv.items && inv.items.length > 0 ? inv.items : [{
      serviceName: 'Photography & Media Production',
      description: 'Production and deliverables',
      quantity: 1,
      price: inv.total || 0,
      rate: inv.total || 0,
      amount: inv.total || 0,
      gstRate: 0,
      cgst: 0,
      sgst: 0,
      tax: 0,
      total: inv.total || 0
    }]).map((it: any) => {
      const q = Number(it.quantity || 1);
      const r = Number(it.rate !== undefined ? it.rate : it.price) || 0;
      const amt = it.amount !== undefined ? Number(it.amount) : q * r;
      const gRate = Number(it.gstRate || 0);
      const t = it.tax !== undefined ? Number(it.tax) : (amt * gRate) / 100;
      return {
        serviceName: it.serviceName || 'Service',
        description: it.description || '',
        quantity: q,
        rate: r,
        price: r,
        amount: amt,
        gstRate: gRate,
        cgst: it.cgst !== undefined ? Number(it.cgst) : t / 2,
        sgst: it.sgst !== undefined ? Number(it.sgst) : t / 2,
        tax: t,
        total: it.total !== undefined ? Number(it.total) : amt + t
      };
    });

    const bBy = inv.billedBy ? { ...DEFAULT_BILLED_BY, ...inv.billedBy } : { ...DEFAULT_BILLED_BY };
    const bTo = inv.billedTo ? {
      clientName: inv.billedTo.clientName || inv.billedTo.name || clientObj.name || '',
      companyName: inv.billedTo.companyName || clientObj.companyName || '',
      addressLine1: inv.billedTo.addressLine1 || clientObj.billingAddress || clientObj.location || '',
      addressLine2: inv.billedTo.addressLine2 || '',
      city: inv.billedTo.city || clientObj.city || 'Hyderabad',
      state: inv.billedTo.state || clientObj.state || 'Telangana',
      country: inv.billedTo.country || 'India',
      pinCode: inv.billedTo.pinCode || clientObj.pinCode || '500016',
      email: inv.billedTo.email || clientObj.email || '',
      phone: inv.billedTo.phone || clientObj.phone || '',
      gstin: inv.billedTo.gstin || clientObj.gstin || clientObj.gstNumber || '',
      pan: inv.billedTo.pan || ''
    } : {
      clientName: clientObj.name || inv.clientName || '',
      companyName: clientObj.companyName || '',
      addressLine1: clientObj.billingAddress || clientObj.location || '',
      addressLine2: '',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pinCode: '500016',
      email: clientObj.email || inv.clientEmail || '',
      phone: clientObj.phone || '',
      gstin: clientObj.gstin || clientObj.gstNumber || '',
      pan: ''
    };

    const bDetails = inv.bankDetails ? { ...DEFAULT_BANK_DETAILS, ...inv.bankDetails } : { ...DEFAULT_BANK_DETAILS };
    const discType = inv.discountType || (inv.discount > 0 ? 'fixed' : 'none');
    const discVal = inv.discountValue !== undefined ? inv.discountValue : (inv.discount || 0);

    const initialForm = {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      bookingId: inv.bookingId?.id || inv.bookingId || '',
      clientId: clientObj.id || clientObj._id || inv.clientId || '',
      clientMode: 'existing',
      issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : getDefaultDates().issueDate,
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : getDefaultDates().dueDate,
      createdBy: inv.createdBy || 'Dasari Bharadwaj',
      status: inv.status || 'Draft',
      billedBy: bBy,
      billedTo: bTo,
      items: parsedItems,
      discountType: discType,
      discountValue: discVal,
      discount: Number(inv.discount || 0),
      subtotal: Number(inv.subtotal || 0),
      cgst: Number(inv.cgst || (inv.tax ? inv.tax / 2 : 0)),
      sgst: Number(inv.sgst || (inv.tax ? inv.tax / 2 : 0)),
      tax: Number(inv.tax || 0),
      total: Number(inv.total || 0),
      paidAmount: Number(inv.paidAmount || 0),
      balanceAmount: Number(inv.balanceAmount ?? (inv.total - (inv.paidAmount || 0))),
      paymentStatus: inv.paymentStatus || computeInvoicePaymentStatus(inv),
      paymentDate: inv.paymentDate ? new Date(inv.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: inv.paymentMethod || 'UPI',
      transactionId: inv.transactionId || '',
      bankDetails: bDetails,
      upiId: inv.upiId || DEFAULT_UPI_DETAILS.upiId,
      qrCodeUrl: inv.qrCodeUrl || DEFAULT_UPI_DETAILS.qrCodeUrl,
      upiInstruction: inv.upiInstruction || DEFAULT_UPI_DETAILS.upiInstruction,
      upiNote: inv.upiNote || DEFAULT_UPI_DETAILS.upiNote,
      signatureUrl: inv.signatureUrl || '',
      invoiceTheme: inv.invoiceTheme || 'purple',
      notes: inv.notes || '',
      terms: inv.terms || '',
      sendEmail: false
    };

    setInvoiceForm(initialForm);
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceItemFieldChange = (idx: number, field: string, val: any) => {
    const updated = [...invoiceForm.items];
    const current = { ...updated[idx], [field]: val };

    const qty = Math.max(1, Number(field === 'quantity' ? val : current.quantity) || 1);
    const rate = Math.max(0, Number(field === 'rate' || field === 'price' ? val : (current.rate !== undefined ? current.rate : current.price)) || 0);
    const gstRate = Math.max(0, Number(field === 'gstRate' ? val : current.gstRate) || 0);
    const amount = qty * rate;
    const tax = (amount * gstRate) / 100;
    const cgst = tax / 2;
    const sgst = tax / 2;
    const total = amount + tax;

    updated[idx] = {
      ...current,
      quantity: qty,
      rate,
      price: rate,
      gstRate,
      amount,
      tax,
      cgst,
      sgst,
      total
    };

    recalculateAndSetForm(updated, invoiceForm.discountType, invoiceForm.discountValue, invoiceForm.paidAmount);
  };

  const handleDuplicateInvoiceItem = (idx: number) => {
    const clone = { ...invoiceForm.items[idx] };
    const updated = [...invoiceForm.items];
    updated.splice(idx + 1, 0, clone);
    recalculateAndSetForm(updated, invoiceForm.discountType, invoiceForm.discountValue, invoiceForm.paidAmount);
  };

  const handleDeleteInvoiceItem = (idx: number) => {
    if (invoiceForm.items.length <= 1) {
      alert('An invoice must contain at least one line item.');
      return;
    }
    const item = invoiceForm.items[idx];
    const hasContent = item.serviceName || item.description || (item.rate && item.rate > 0);
    if (hasContent && !confirm(`Remove item #${idx + 1} (${item.serviceName || 'Line item'})?`)) {
      return;
    }
    const updated = invoiceForm.items.filter((_: any, i: number) => i !== idx);
    recalculateAndSetForm(updated, invoiceForm.discountType, invoiceForm.discountValue, invoiceForm.paidAmount);
  };

  const handleAddInvoiceItem = () => {
    const newItem = {
      serviceName: '',
      description: '',
      gstRate: 18,
      quantity: 1,
      rate: 0,
      price: 0,
      amount: 0,
      cgst: 0,
      sgst: 0,
      tax: 0,
      total: 0
    };
    const updated = [...invoiceForm.items, newItem];
    recalculateAndSetForm(updated, invoiceForm.discountType, invoiceForm.discountValue, invoiceForm.paidAmount);
  };

  const handleSelectClient = (clientId: string) => {
    const cl = clients.find(c => (c.id || c._id) === clientId);
    if (cl) {
      setInvoiceForm((prev: any) => ({
        ...prev,
        clientId,
        billedTo: {
          ...prev.billedTo,
          clientName: cl.name || '',
          companyName: cl.companyName || '',
          email: cl.email || '',
          phone: cl.phone || '',
          addressLine1: cl.billingAddress || cl.location || '',
          addressLine2: '',
          city: cl.city || 'Hyderabad',
          state: cl.state || 'Telangana',
          country: cl.country || 'India',
          pinCode: cl.pinCode || '500016',
          gstin: cl.gstin || cl.gstNumber || '',
          pan: cl.pan || ''
        }
      }));
    } else {
      setInvoiceForm((prev: any) => ({ ...prev, clientId }));
    }
  };

  const handleSaveInvoice = async (forcedStatus?: string) => {
    if (!invoiceForm.invoiceNumber || !invoiceForm.invoiceNumber.trim()) {
      alert('Invoice Number is required.');
      return;
    }
    const clientName = invoiceForm.billedTo?.clientName || invoiceForm.billedTo?.companyName;
    if (!clientName || !clientName.trim()) {
      alert('Client or Company Name is required in Billed To.');
      return;
    }
    if (!invoiceForm.items || invoiceForm.items.length === 0) {
      alert('Please add at least one line item to the invoice.');
      return;
    }

    setActionLoading(true);
    try {
      const isEdit = !!invoiceForm.id;
      const url = isEdit ? `/api/admin/invoices/${invoiceForm.id}` : '/api/admin/invoices';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...invoiceForm,
        status: forcedStatus || invoiceForm.status || 'Draft',
        manualClientName: invoiceForm.billedTo?.clientName || '',
        manualClientEmail: invoiceForm.billedTo?.email || '',
        manualClientPhone: invoiceForm.billedTo?.phone || '',
        manualClientAddress: [invoiceForm.billedTo?.addressLine1, invoiceForm.billedTo?.city, invoiceForm.billedTo?.state].filter(Boolean).join(', '),
        shouldSendEmail: false
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        await loadDashboardData();
        setCreatedInvoiceResult(data.invoice || data);
      } else {
        const err = await res.json();
        alert(`Error saving invoice: ${err.error || 'Operation failed'}`);
      }
    } catch (err: any) {
      console.error('Invoice save failed:', err);
      alert('Network error while saving invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadAllThemes = (invoiceNumber: string) => {
    INVOICE_THEME_LIST.forEach((t, i) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `/invoices/${invoiceNumber}.pdf?theme=${t.id}`;
        link.download = `${invoiceNumber}-${t.id}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, i * 350);
    });
  };

  const handleSendInvoiceWithTheme = async (invoiceId: string, theme: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      });
      if (res.ok) {
        alert('Invoice PDF generated and emailed to client successfully!');
        setSendInvoiceModalInvoice(null);
        await loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to email invoice PDF.');
      }
    } catch (err: any) {
      alert(err.message || 'Error sending invoice.');
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
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: inv.id,
          amount: inv.balanceAmount || inv.total,
          method: 'Other',
          paymentMethod: 'Other',
          transactionId: `FULL-SETTLE-${Date.now()}`,
          paymentDate: new Date().toISOString().split('T')[0],
          notes: 'Marked 100% paid by admin'
        })
      });
      if (res.ok) {
        await loadDashboardData();
        alert('Invoice marked as Paid and payment record created.');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to mark invoice as paid');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRecordPaymentModal = (inv: any) => {
    setRecordPaymentInvoice(inv);
    setRecordPaymentForm({
      amount: inv.balanceAmount !== undefined ? inv.balanceAmount : inv.total,
      method: 'UPI',
      transactionId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Payment for ${inv.invoiceNumber}`
    });
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordPaymentInvoice) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: recordPaymentInvoice.id,
          amount: Number(recordPaymentForm.amount),
          paymentMethod: recordPaymentForm.method,
          method: recordPaymentForm.method,
          transactionId: recordPaymentForm.transactionId,
          paymentDate: recordPaymentForm.paymentDate,
          notes: recordPaymentForm.notes
        })
      });
      if (res.ok) {
        alert('Payment recorded successfully and invoice balance updated!');
        setRecordPaymentInvoice(null);
        await loadDashboardData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while recording payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!confirm('Approve this client payment confirmation? This will update the invoice amount paid and balance.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        alert('Payment approved successfully!');
        await loadDashboardData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to approve payment');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${rejectingPayment.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        alert('Payment confirmation rejected.');
        setRejectingPayment(null);
        await loadDashboardData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to reject payment');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenInvoicePayments = (inv: any) => {
    setInvoicePaymentsView(inv);
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
              <CreditCard className="h-4 w-4 text-[#D4AF37]" /> Invoice Generator ({invoices.length})
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

            {/* Financial & Payment Overview */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[#D4AF37] font-semibold uppercase tracking-wider text-xs font-sans">Payment & Financial Overview</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">MongoDB Live Records</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-[#0a0a0a] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Total Invoiced</span>
                    <span className="text-xl font-serif text-white font-semibold">₹{paymentMetrics.totalInvoiced.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-6 bg-[#0a0a0a] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Total Paid</span>
                    <span className="text-xl font-serif text-emerald-400 font-semibold">₹{paymentMetrics.totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-6 bg-[#0a0a0a] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Total Pending</span>
                    <span className="text-xl font-serif text-amber-400 font-semibold">₹{paymentMetrics.totalPending.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-full text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-6 bg-[#0a0a0a] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Total Outstanding</span>
                    <span className="text-xl font-serif text-rose-400 font-semibold">₹{paymentMetrics.totalOutstanding.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-full text-rose-400">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
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
                <label htmlFor="admin-booking-search" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Search Name/Phone/Email</label>
                <input
                  id="admin-booking-search"
                  name="bookingSearch"
                  type="text"
                  placeholder="e.g. Bharadwaj"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-sans"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-booking-status-filter" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Filter by Status</label>
                <select
                  id="admin-booking-status-filter"
                  name="bookingFilterStatus"
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
                <label htmlFor="admin-booking-eventtype-filter" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Filter by Event Type</label>
                <select
                  id="admin-booking-eventtype-filter"
                  name="bookingFilterEventType"
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
                <label htmlFor="admin-booking-date-filter" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Filter by Date</label>
                <input
                  id="admin-booking-date-filter"
                  name="bookingFilterDate"
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
                        <td className="p-4 text-[#D4AF37] font-semibold">
                          {book.budget !== null && book.budget !== undefined && book.budget !== '' ? (
                            typeof book.budget === 'number' ? `₹${book.budget.toLocaleString('en-IN')}` : book.budget
                          ) : 'TBD'}
                        </td>
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
                    name="title"
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
                      name="client"
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
                      name="category"
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
                      name="location"
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
                      name="date"
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
                    name="image"
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
                    name="videoUrl"
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
                    name="details"
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
                    name="title"
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
                      name="category"
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
                      name="type"
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
                    name="image"
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
                      name="videoUrl"
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
                    name="title"
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
                      name="slug"
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
                      name="category"
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
                      name="readTime"
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
                      id="admin-blog-featured"
                      name="isFeatured"
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
                    name="image"
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
                    name="summary"
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
                    name="content"
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
                <h2 className="font-serif text-2xl md:text-3xl text-white">Invoice Generator</h2>
                <p className="text-gray-400 mt-1">Generate dynamic invoices from bookings, handle receipts, track taxes and history logs.</p>
              </div>
              <button
                onClick={handleOpenNewInvoiceModal}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-none"
              >
                <Plus className="h-4 w-4" /> Generate Invoice
              </button>
            </div>

            {/* Pending Payment Confirmations section */}
            {adminPayments.some((p) => p.status === 'Pending') && (
              <div className="p-6 border border-amber-500/30 bg-amber-500/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                    <AlertCircle className="h-4 w-4" />
                    <span>Pending Client Payment Confirmations ({adminPayments.filter((p) => p.status === 'Pending').length})</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Requires Admin Verification</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider text-[9px]">
                        <th className="py-2">Date</th>
                        <th className="py-2">Client / Invoice</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Method</th>
                        <th className="py-2">Transaction ID / UTR</th>
                        <th className="py-2">Receipt / Notes</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300 font-light">
                      {adminPayments
                        .filter((p) => p.status === 'Pending')
                        .map((pay) => (
                          <tr key={pay.id || pay._id} className="hover:bg-white/[0.02]">
                            <td className="py-3 text-gray-400">
                              {new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              <span className="font-semibold text-white block">{pay.invoiceNumber || pay.invoiceId?.invoiceNumber || 'Invoice'}</span>
                              <span className="text-[10px] text-gray-500">{pay.clientId?.name || pay.clientEmail || ''}</span>
                            </td>
                            <td className="py-3 font-semibold text-emerald-400">
                              ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 text-[9px] bg-white/5 border border-white/10 text-gray-300">
                                {pay.method || 'Bank Transfer / UPI'}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-[11px] text-[#D4AF37]">
                              {pay.transactionId || 'N/A'}
                            </td>
                            <td className="py-3">
                              {pay.screenshotUrl ? (
                                <a
                                  href={pay.screenshotUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#D4AF37] hover:underline flex items-center gap-1 text-[10px]"
                                >
                                  View Receipt <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-gray-500 text-[10px]">{pay.notes || 'No notes'}</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleApprovePayment(pay.id || pay._id)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"
                                  title="Approve and record payment against invoice"
                                >
                                  <Check className="h-3 w-3" /> Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingPayment(pay);
                                    setRejectReason('');
                                  }}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"
                                  title="Reject confirmation with reason"
                                >
                                  <X className="h-3 w-3" /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Filter controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-[#0a0a0a] border border-white/5 p-4">
              <div className="flex items-center gap-2">
                <input
                  id="admin-invoice-search"
                  name="invoiceSearch"
                  type="text"
                  placeholder="Search invoice number or client name..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none text-xs w-64 animate-all"
                />
                <select
                  id="admin-invoice-status-filter"
                  name="invoiceFilterStatus"
                  value={invoiceFilterStatus}
                  onChange={(e) => setInvoiceFilterStatus(e.target.value)}
                  className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none text-xs cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider font-semibold">
                <span className="text-gray-400">
                  Total Billed: <strong className="text-white">₹{invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0).toLocaleString('en-IN')}</strong>
                </span>
                <span className="text-emerald-400">
                  Total Paid: <strong>₹{invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0).toLocaleString('en-IN')}</strong>
                </span>
                <span className="text-amber-400">
                  Total Due: <strong>₹{invoices.reduce((sum, inv) => sum + (Number(inv.balanceAmount) || 0), 0).toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>

            {/* Invoices list table */}
            <div className="p-6 border border-white/5 bg-[#0a0a0a]">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs min-w-[750px]">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider text-[9px]">
                      <th className="py-2.5">Invoice No</th>
                      <th className="py-2.5">Client & Inquiry</th>
                      <th className="py-2.5">Dates</th>
                      <th className="py-2.5">Payment Breakdown</th>
                      <th className="py-2.5">Payment Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-400 font-light">
                    {invoices
                      .filter((inv) => {
                        const clientName = inv.clientName || '';
                        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
                          clientName.toLowerCase().includes(invoiceSearch.toLowerCase());
                        const pStatus = inv.paymentStatus || computeInvoicePaymentStatus(inv);
                        const pLabel = formatPaymentStatusLabel(pStatus);
                        const matchesStatus = invoiceFilterStatus === 'all' || 
                          inv.status === invoiceFilterStatus || 
                          pLabel.toLowerCase() === invoiceFilterStatus.toLowerCase() ||
                          pStatus.toLowerCase() === invoiceFilterStatus.toLowerCase();
                        return matchesSearch && matchesStatus;
                      })
                      .map((inv) => {
                        const pStatus = inv.paymentStatus || computeInvoicePaymentStatus(inv);
                        const pLabel = formatPaymentStatusLabel(pStatus);
                        const paidAmt = Number(inv.paidAmount) || 0;
                        const dueAmt = Number(inv.balanceAmount ?? (inv.total - paidAmt));

                        return (
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
                              <span className="block text-white font-medium">Total: ₹{Number(inv.total || 0).toLocaleString('en-IN')}</span>
                              <span className="text-emerald-400 block text-[11px]">Paid: ₹{paidAmt.toLocaleString('en-IN')}</span>
                              <span className="text-amber-400 block font-medium text-[11px]">Due: ₹{dueAmt.toLocaleString('en-IN')}</span>
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 text-[8px] font-semibold tracking-wider uppercase border inline-block ${
                                pStatus === 'PAID' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' :
                                pStatus === 'PARTIALLY_PAID' ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' :
                                pStatus === 'OVERDUE' ? 'border-rose-500/30 text-rose-400 bg-rose-500/5' : 
                                'border-gray-500/30 text-gray-400 bg-gray-500/5'
                              }`}>
                                {pLabel}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex gap-1.5 justify-end items-center">
                                {/* Record Payment Action */}
                                <button
                                  onClick={() => handleOpenRecordPaymentModal(inv)}
                                  className="px-2 py-1 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold text-[9px] uppercase tracking-wider"
                                  title="Record Payment / Add Partial or Full Payment"
                                >
                                  + Record Pay
                                </button>

                                {/* Payment History */}
                                <button
                                  onClick={() => handleOpenInvoicePayments(inv)}
                                  className="p-1.5 border border-white/10 hover:border-[#D4AF37] text-gray-300 hover:text-[#D4AF37]"
                                  title="View Payments History for this Invoice"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                </button>

                                {/* Download PDF with Theme Options */}
                                <button
                                  onClick={() => {
                                    setDownloadThemeModalInvoice(inv);
                                    setDownloadThemeSelected(inv.invoiceTheme || 'purple');
                                  }}
                                  className="p-1.5 border border-white/10 hover:border-[#D4AF37] text-gray-300 hover:text-[#D4AF37] flex items-center gap-1"
                                  title="Download PDF (Choose Theme)"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </button>

                                {/* Quick Open PDF (Saved Theme) */}
                                <a
                                  href={`/invoices/${inv.invoiceNumber}.pdf?theme=${inv.invoiceTheme || 'purple'}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 border border-white/5 hover:border-white text-gray-400 hover:text-white"
                                  title={`Quick Open PDF (${inv.invoiceTheme || 'purple'})`}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                
                                <button
                                  onClick={() => {
                                    setSendInvoiceModalInvoice(inv);
                                    setSendInvoiceThemeSelected(inv.invoiceTheme || 'purple');
                                  }}
                                  className="p-1.5 border border-white/5 hover:border-white text-gray-400 hover:text-white"
                                  title="Send PDF Invoice to Client"
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

                                {/* Quick Mark Paid */}
                                {pStatus !== 'PAID' && (
                                  <button
                                    onClick={() => handleQuickMarkPaid(inv)}
                                    className="px-1.5 py-1 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-700/40 text-[8px] uppercase font-bold"
                                    title="Quick Mark 100% Paid"
                                  >
                                    Mark Paid
                                  </button>
                                )}

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
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* GENERATE / EDIT INVOICE MODAL (TWO-COLUMN REDESIGNED STUDIO) */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#080808]/95 backdrop-blur-md overflow-y-auto text-white">
          {createdInvoiceResult ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-[#0f0f0f] border border-[#D4AF37]/40 max-w-xl w-full p-8 font-sans text-xs relative text-center text-white flex flex-col items-center gap-6 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsInvoiceModalOpen(false);
                    setCreatedInvoiceResult(null);
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="h-16 w-16 rounded-full border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] bg-[#D4AF37]/10 animate-pulse">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                
                <div>
                  <h4 className="font-serif text-2xl text-white mb-2 uppercase tracking-wider">Invoice Compiled Successfully!</h4>
                  <p className="text-gray-400 leading-relaxed text-xs">
                    Invoice <span className="text-[#D4AF37] font-semibold font-mono text-sm">{createdInvoiceResult.invoiceNumber}</span> has been saved to MongoDB and its PDF is compiled and ready.
                  </p>
                </div>

                {/* Theme Selector for PDF Download */}
                <div className="w-full bg-white/[0.03] border border-white/10 p-4 flex flex-col gap-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 uppercase tracking-widest text-[9px] font-semibold">Select Download Theme</span>
                    <span className="text-[#D4AF37] font-semibold text-[11px] uppercase">
                      {INVOICE_THEMES[downloadThemeSelected]?.name || 'Purple'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {INVOICE_THEME_LIST.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setDownloadThemeSelected(t.id)}
                        className={`flex items-center gap-2 p-2 text-[10px] border transition-all ${
                          downloadThemeSelected === t.id
                            ? 'border-[#D4AF37] bg-white/10 text-white font-bold ring-1 ring-[#D4AF37]'
                            : 'border-white/10 text-gray-400 hover:text-white bg-black/40'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: t.primary }} />
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <a
                    href={`/invoices/${createdInvoiceResult.invoiceNumber}.pdf?theme=${downloadThemeSelected}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Printer className="h-4 w-4" /> Download {INVOICE_THEMES[downloadThemeSelected]?.name} PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDownloadAllThemes(createdInvoiceResult.invoiceNumber)}
                    className="px-5 py-3 border border-white/20 hover:border-white text-gray-300 hover:text-white uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Copy className="h-4 w-4" /> Download All 8 Themes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSendInvoiceModalInvoice(createdInvoiceResult);
                      setSendInvoiceThemeSelected(downloadThemeSelected);
                    }}
                    className="px-5 py-3 border border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 text-[#D4AF37] uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Send className="h-4 w-4" /> Send Email
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsInvoiceModalOpen(false);
                    setCreatedInvoiceResult(null);
                  }}
                  className="text-gray-500 hover:text-white text-xs uppercase tracking-wider underline mt-2"
                >
                  Close & Back to Invoices List
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col min-h-screen">
              {/* Studio Top Header */}
              <div className="sticky top-0 z-30 bg-[#0d0d0d] border-b border-white/10 px-6 py-3.5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-[#D4AF37] animate-pulse" />
                  <h3 className="font-serif text-lg text-white font-medium">
                    {invoiceForm.id ? `Edit Invoice: ${invoiceForm.invoiceNumber}` : 'New Invoice Studio'}
                  </h3>
                  <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 uppercase">
                    {invoiceForm.invoiceNumber || 'NO-ID'}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 text-gray-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getInvoiceTheme(invoiceForm.invoiceTheme).primary }} />
                    {getInvoiceTheme(invoiceForm.invoiceTheme).name} Theme
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLivePreviewMobile(!showLivePreviewMobile)}
                    className="xl:hidden px-3 py-1.5 border border-[#D4AF37] text-[#D4AF37] text-[10px] uppercase font-bold tracking-wider"
                  >
                    {showLivePreviewMobile ? 'Edit Form' : 'Live Preview'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-white border border-white/10 hover:border-white transition-all"
                    title="Close Invoice Editor"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Main Two-Column Layout */}
              <div className="flex-1 max-w-[1750px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: EDITING FORM (7 cols) */}
                <div className={`xl:col-span-7 flex flex-col gap-6 ${showLivePreviewMobile ? 'hidden xl:flex' : 'flex'}`}>

                  {/* 1. INVOICE BASIC INFORMATION CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          1. Invoice Information
                        </h4>
                      </div>
                      <span className="text-[10px] text-gray-500">Basic metadata & numbers</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Invoice Number */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">
                            Invoice No <span className="text-red-400">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setInvoiceForm({ ...invoiceForm, invoiceNumber: generateInvoiceNumber(invoices) })}
                            className="text-[8.5px] text-[#D4AF37] hover:underline uppercase"
                          >
                            Auto
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={invoiceForm.invoiceNumber}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                          placeholder="e.g. DB056"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {/* Invoice Date */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">
                          Invoice Date <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={invoiceForm.issueDate}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {/* Due Date */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">
                          Due Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={invoiceForm.dueDate}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {/* Created By */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">
                          Created By
                        </label>
                        <input
                          type="text"
                          value={invoiceForm.createdBy}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, createdBy: e.target.value })}
                          placeholder="Dasari Bharadwaj"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    {/* Invoice Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">
                          Invoice Workflow Status
                        </label>
                        <select
                          value={invoiceForm.status}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Viewed">Viewed</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">
                          Link Booking (Optional)
                        </label>
                        <select
                          value={invoiceForm.bookingId}
                          onChange={(e) => {
                            const bid = e.target.value;
                            const booking = bookings.find(b => b.id === bid);
                            if (booking) {
                              const client = clients.find(c => c.email.trim().toLowerCase() === booking.email.trim().toLowerCase());
                              if (client) {
                                handleSelectClient(client.id || client._id);
                              }
                            }
                            setInvoiceForm((prev: any) => ({ ...prev, bookingId: bid }));
                          }}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                        >
                          <option value="">-- None / Direct Invoice --</option>
                          {bookings.map(b => (
                            <option key={b.id} value={b.id}>{b.name} - {b.eventType} ({b.date})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. BILLED BY CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          2. Billed By (Issuer Details)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInvoiceForm((prev: any) => ({ ...prev, billedBy: { ...DEFAULT_BILLED_BY } }))}
                        className="text-[9px] text-[#D4AF37] hover:underline uppercase tracking-wider flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> Restore Default
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Name</label>
                        <input
                          type="text"
                          value={invoiceForm.billedBy.name}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedBy: { ...prev.billedBy, name: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Address Line 1</label>
                        <input
                          type="text"
                          value={invoiceForm.billedBy.addressLine1}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedBy: { ...prev.billedBy, addressLine1: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">City</label>
                        <input
                          type="text"
                          value={invoiceForm.billedBy.city}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedBy: { ...prev.billedBy, city: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">State & Country</label>
                        <input
                          type="text"
                          value={`${invoiceForm.billedBy.state}, ${invoiceForm.billedBy.country}`}
                          onChange={(e) => {
                            const [state, country] = e.target.value.split(',').map(s => s.trim());
                            setInvoiceForm((prev: any) => ({ ...prev, billedBy: { ...prev.billedBy, state: state || 'Telangana', country: country || 'India' } }));
                          }}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">PIN Code</label>
                        <input
                          type="text"
                          value={invoiceForm.billedBy.pinCode}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedBy: { ...prev.billedBy, pinCode: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">PAN</label>
                        <input
                          type="text"
                          value={invoiceForm.billedBy.pan}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedBy: { ...prev.billedBy, pan: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Email</label>
                        <input
                          type="email"
                          value={invoiceForm.billedBy.email}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedBy: { ...prev.billedBy, email: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Phone</label>
                        <input
                          type="text"
                          value={invoiceForm.billedBy.phone}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedBy: { ...prev.billedBy, phone: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. BILLED TO CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-white/5 gap-3">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          3. Billed To (Client / Company Details)
                        </h4>
                      </div>

                      {/* Mode Toggle */}
                      <div className="flex items-center gap-3 text-[10px]">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="clientSelectMode"
                            checked={!isManualClient}
                            onChange={() => setIsManualClient(false)}
                            className="accent-[#D4AF37]"
                          />
                          <span className={!isManualClient ? 'text-white font-bold' : 'text-gray-400'}>Select Client</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="clientSelectMode"
                            checked={isManualClient}
                            onChange={() => {
                              setIsManualClient(true);
                              setInvoiceForm((prev: any) => ({ ...prev, clientId: '' }));
                            }}
                            className="accent-[#D4AF37]"
                          />
                          <span className={isManualClient ? 'text-white font-bold' : 'text-gray-400'}>+ Enter New Client</span>
                        </label>
                      </div>
                    </div>

                    {!isManualClient && clients.length > 0 && (
                      <div className="mb-4 p-3 bg-white/[0.02] border border-white/10 flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">
                          Choose From Existing Clients (Auto-populates fields)
                        </label>
                        <select
                          value={invoiceForm.clientId}
                          onChange={(e) => handleSelectClient(e.target.value)}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                        >
                          <option value="">-- Choose Existing Client --</option>
                          {clients.map(c => (
                            <option key={c.id || c._id} value={c.id || c._id}>
                              {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">
                          Client / Company Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={invoiceForm.billedTo.clientName}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedTo: { ...prev.billedTo, clientName: e.target.value } }))}
                          placeholder="e.g. Yoda Lifeline Diagnostics"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white font-medium focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Address Line 1</label>
                        <input
                          type="text"
                          value={invoiceForm.billedTo.addressLine1}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedTo: { ...prev.billedTo, addressLine1: e.target.value } }))}
                          placeholder="Door no: 6-3-862/A Lal Banglow"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          value={invoiceForm.billedTo.addressLine2}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedTo: { ...prev.billedTo, addressLine2: e.target.value } }))}
                          placeholder="Ameerpet, Somajiguda"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">City</label>
                        <input
                          type="text"
                          value={invoiceForm.billedTo.city}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedTo: { ...prev.billedTo, city: e.target.value } }))}
                          placeholder="Hyderabad"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">State & Country</label>
                        <input
                          type="text"
                          value={`${invoiceForm.billedTo.state}, ${invoiceForm.billedTo.country}`}
                          onChange={(e) => {
                            const [state, country] = e.target.value.split(',').map(s => s.trim());
                            setInvoiceForm((prev: any) => ({ ...prev, billedTo: { ...prev.billedTo, state: state || 'Telangana', country: country || 'India' } }));
                          }}
                          placeholder="Telangana, India"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">PIN Code</label>
                        <input
                          type="text"
                          value={invoiceForm.billedTo.pinCode}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedTo: { ...prev.billedTo, pinCode: e.target.value } }))}
                          placeholder="500016"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Email Address</label>
                        <input
                          type="email"
                          value={invoiceForm.billedTo.email}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedTo: { ...prev.billedTo, email: e.target.value } }))}
                          placeholder="client@yoda.com"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Phone Number</label>
                        <input
                          type="text"
                          value={invoiceForm.billedTo.phone}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedTo: { ...prev.billedTo, phone: e.target.value } }))}
                          placeholder="+91 99999 88888"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">GSTIN (Optional)</label>
                        <input
                          type="text"
                          value={invoiceForm.billedTo.gstin}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, billedTo: { ...prev.billedTo, gstin: e.target.value } }))}
                          placeholder="36AAAAA0000A1Z5"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. INVOICE ITEMS DYNAMIC TABLE CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Images className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          4. Invoice Line Items ({invoiceForm.items.length})
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddInvoiceItem}
                        className="px-3 py-1.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Item
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      {invoiceForm.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-[#0a0a0a] border border-white/10 p-4 relative flex flex-col gap-3">
                          {/* Row Header with index and actions */}
                          <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                              Item #{idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDuplicateInvoiceItem(idx)}
                                className="px-2 py-0.5 border border-white/15 hover:border-white text-gray-300 hover:text-white text-[9px] uppercase tracking-wider flex items-center gap-1"
                                title="Duplicate this line item"
                              >
                                <Copy className="h-3 w-3" /> Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoiceItem(idx)}
                                className="px-2 py-0.5 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white hover:bg-red-500/20 text-[9px] uppercase tracking-wider flex items-center gap-1"
                                title="Remove this line item"
                              >
                                <Trash2 className="h-3 w-3" /> Remove
                              </button>
                            </div>
                          </div>

                          {/* Item Title and Multiline Description */}
                          <div className="grid grid-cols-1 gap-2.5">
                            <div className="flex flex-col gap-1">
                              <label className="text-gray-400 uppercase tracking-widest text-[8px] font-semibold">
                                Item / Service Title <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={item.serviceName}
                                onChange={(e) => handleInvoiceItemFieldChange(idx, 'serviceName', e.target.value)}
                                placeholder="e.g. Equipment Rental & Cinematography Service"
                                className="bg-[#111111] border border-white/15 px-3 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-[#D4AF37]"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-gray-400 uppercase tracking-widest text-[8px] font-semibold">
                                Description (Supports Multiple Lines e.g. equipment breakdown, dates, hospital setup)
                              </label>
                              <textarea
                                rows={4}
                                value={item.description}
                                onChange={(e) => handleInvoiceItemFieldChange(idx, 'description', e.target.value)}
                                placeholder="Equipment Rental service on 24-June-2026 at KIM'S HOSPITAL Kondapur.&#10;&#10;Fx 3 - 2&#10;50mm -1&#10;Tripod -1..."
                                className="bg-[#111111] border border-white/15 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37] font-mono resize-y"
                              />
                            </div>
                          </div>

                          {/* Numerical and Tax Financial Columns */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-2 border-t border-white/5 items-end">
                            <div className="flex flex-col gap-1">
                              <label className="text-gray-400 uppercase tracking-widest text-[7.5px]">GST Rate (%)</label>
                              <select
                                value={item.gstRate}
                                onChange={(e) => handleInvoiceItemFieldChange(idx, 'gstRate', Number(e.target.value))}
                                className="bg-[#111111] border border-white/15 px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                              >
                                <option value={0}>0% GST</option>
                                <option value={5}>5% GST</option>
                                <option value={12}>12% GST</option>
                                <option value={18}>18% GST</option>
                                <option value={28}>28% GST</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-gray-400 uppercase tracking-widest text-[7.5px]">Qty</label>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleInvoiceItemFieldChange(idx, 'quantity', Number(e.target.value))}
                                className="bg-[#111111] border border-white/15 px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:border-[#D4AF37]"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-gray-400 uppercase tracking-widest text-[7.5px]">Rate (₹)</label>
                              <input
                                type="number"
                                min={0}
                                value={item.rate !== undefined ? item.rate : item.price}
                                onChange={(e) => handleInvoiceItemFieldChange(idx, 'rate', Number(e.target.value))}
                                className="bg-[#111111] border border-white/15 px-2 py-1.5 text-white text-xs text-right focus:outline-none focus:border-[#D4AF37]"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-gray-500 uppercase tracking-widest text-[7.5px]">Amount (₹)</label>
                              <div className="px-2 py-1.5 bg-white/5 border border-white/5 text-right font-mono text-xs text-gray-300">
                                ₹{(item.amount || 0).toLocaleString('en-IN')}
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-gray-500 uppercase tracking-widest text-[7.5px]">CGST (₹)</label>
                              <div className="px-2 py-1.5 bg-white/5 border border-white/5 text-right font-mono text-xs text-gray-400">
                                ₹{(item.cgst || 0).toLocaleString('en-IN')}
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-gray-500 uppercase tracking-widest text-[7.5px]">SGST (₹)</label>
                              <div className="px-2 py-1.5 bg-white/5 border border-white/5 text-right font-mono text-xs text-gray-400">
                                ₹{(item.sgst || 0).toLocaleString('en-IN')}
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                              <label className="text-[#D4AF37] uppercase tracking-widest text-[7.5px] font-bold">Total (₹)</label>
                              <div className="px-2 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-right font-mono text-xs text-[#D4AF37] font-bold">
                                ₹{(item.total || 0).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddInvoiceItem}
                        className="w-full py-2.5 border border-dashed border-white/20 hover:border-[#D4AF37] text-gray-400 hover:text-[#D4AF37] text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" /> + Add Another Item Row
                      </button>
                    </div>
                  </div>

                  {/* 5. TAX & DISCOUNT CALCULATION CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          5. Tax & Discount Calculations
                        </h4>
                      </div>
                      <span className="text-[10px] text-gray-500">Auto calculated breakdown</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Discount Controls */}
                      <div className="flex flex-col gap-3 p-4 bg-[#0a0a0a] border border-white/5">
                        <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Discount Options</span>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-gray-400 uppercase tracking-widest text-[8px]">Discount Type</label>
                            <select
                              value={invoiceForm.discountType}
                              onChange={(e) => recalculateAndSetForm(invoiceForm.items, e.target.value, invoiceForm.discountValue, invoiceForm.paidAmount)}
                              className="bg-[#111111] border border-white/15 px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                            >
                              <option value="none">None</option>
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-gray-400 uppercase tracking-widest text-[8px]">Discount Value</label>
                            <input
                              type="number"
                              min={0}
                              disabled={invoiceForm.discountType === 'none'}
                              value={invoiceForm.discountValue}
                              onChange={(e) => recalculateAndSetForm(invoiceForm.items, invoiceForm.discountType, Number(e.target.value), invoiceForm.paidAmount)}
                              className="bg-[#111111] border border-white/15 px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37] disabled:opacity-40"
                              placeholder={invoiceForm.discountType === 'percentage' ? 'e.g. 10%' : 'e.g. 5000'}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Totals Breakdown List */}
                      <div className="flex flex-col gap-2 p-4 bg-[#0a0a0a] border border-white/5 text-xs">
                        <div className="flex justify-between text-gray-400">
                          <span>Items Subtotal:</span>
                          <span className="font-mono text-white">₹{Number(invoiceForm.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>CGST (Central Tax):</span>
                          <span className="font-mono text-white">₹{Number(invoiceForm.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>SGST (State Tax):</span>
                          <span className="font-mono text-white">₹{Number(invoiceForm.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Total Tax:</span>
                          <span className="font-mono text-white">₹{Number(invoiceForm.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {invoiceForm.discount > 0 && (
                          <div className="flex justify-between text-rose-400">
                            <span>Discount Applied:</span>
                            <span className="font-mono">-₹{Number(invoiceForm.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="h-[1px] bg-white/10 my-1" />
                        <div className="flex justify-between text-sm font-bold text-[#D4AF37]">
                          <span>Grand Total (INR):</span>
                          <span className="font-mono">₹{Number(invoiceForm.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. PAYMENT DETAILS CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          6. Payment Details & Balance Tracking
                        </h4>
                      </div>
                      <span className="text-[10px] text-gray-500">Advance, partial, or full payment</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Payment Status</label>
                        <select
                          value={invoiceForm.paymentStatus}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, paymentStatus: e.target.value }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Amount Paid (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={invoiceForm.paidAmount}
                          onChange={(e) => recalculateAndSetForm(invoiceForm.items, invoiceForm.discountType, invoiceForm.discountValue, Number(e.target.value))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Payment Date</label>
                        <input
                          type="date"
                          value={invoiceForm.paymentDate}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, paymentDate: e.target.value }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Payment Method</label>
                        <select
                          value={invoiceForm.paymentMethod}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, paymentMethod: e.target.value }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                        >
                          <option value="UPI">UPI</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5 items-center">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Transaction ID / Reference UTR</label>
                        <input
                          type="text"
                          value={invoiceForm.transactionId}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, transactionId: e.target.value }))}
                          placeholder="e.g. UPI/1234567890/DB"
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {/* Readonly Balance Due box */}
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-amber-400 font-bold block">Balance Due (Auto Computed)</span>
                          <span className="text-[10px] text-gray-400">Total ₹{Number(invoiceForm.total || 0).toLocaleString('en-IN')} - Paid ₹{Number(invoiceForm.paidAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-lg font-bold font-mono text-amber-300">
                          ₹{Number(invoiceForm.balanceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 7. BANK DETAILS CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          7. Bank Details
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInvoiceForm((prev: any) => ({ ...prev, bankDetails: { ...DEFAULT_BANK_DETAILS } }))}
                        className="text-[9px] text-[#D4AF37] hover:underline uppercase tracking-wider flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> Restore Default
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Account Name</label>
                        <input
                          type="text"
                          value={invoiceForm.bankDetails.accountName}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, bankDetails: { ...prev.bankDetails, accountName: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Account Number</label>
                        <input
                          type="text"
                          value={invoiceForm.bankDetails.accountNumber}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, bankDetails: { ...prev.bankDetails, accountNumber: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">IFSC Code</label>
                        <input
                          type="text"
                          value={invoiceForm.bankDetails.ifsc}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, bankDetails: { ...prev.bankDetails, ifsc: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Account Type</label>
                        <input
                          type="text"
                          value={invoiceForm.bankDetails.accountType}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, bankDetails: { ...prev.bankDetails, accountType: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Bank Name</label>
                        <input
                          type="text"
                          value={invoiceForm.bankDetails.bankName}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, bankDetails: { ...prev.bankDetails, bankName: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Branch</label>
                        <input
                          type="text"
                          value={invoiceForm.bankDetails.branch}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, bankDetails: { ...prev.bankDetails, branch: e.target.value } }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 8. UPI PAYMENT CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          8. UPI Payment & QR Code
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInvoiceForm((prev: any) => ({ ...prev, upiId: DEFAULT_UPI_DETAILS.upiId, qrCodeUrl: DEFAULT_UPI_DETAILS.qrCodeUrl, upiInstruction: DEFAULT_UPI_DETAILS.upiInstruction, upiNote: DEFAULT_UPI_DETAILS.upiNote }))}
                        className="text-[9px] text-[#D4AF37] hover:underline uppercase tracking-wider flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> Restore Default UPI & QR
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start text-xs">
                      <div className="md:col-span-2 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-400 uppercase tracking-widest text-[8px]">UPI ID</label>
                          <input
                            type="text"
                            value={invoiceForm.upiId}
                            onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, upiId: e.target.value }))}
                            className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-gray-400 uppercase tracking-widest text-[8px]">QR Code Image URL (Cloudinary)</label>
                          <input
                            type="url"
                            value={invoiceForm.qrCodeUrl}
                            onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, qrCodeUrl: e.target.value }))}
                            className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-gray-400 uppercase tracking-widest text-[8px]">UPI Instruction Note</label>
                          <input
                            type="text"
                            value={invoiceForm.upiInstruction}
                            onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, upiInstruction: e.target.value }))}
                            className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-gray-400 uppercase tracking-widest text-[8px]">Maximum UPI Transfer Note</label>
                          <input
                            type="text"
                            value={invoiceForm.upiNote}
                            onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, upiNote: e.target.value }))}
                            className="bg-[#0a0a0a] border border-white/15 px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>

                      {/* QR Preview Box */}
                      <div className="flex flex-col items-center justify-center p-4 bg-[#0a0a0a] border border-white/10 text-center">
                        <span className="text-[9px] uppercase tracking-widest text-gray-500 mb-2">QR Code Preview</span>
                        <div className="w-28 h-28 bg-white p-2 border border-zinc-300 flex items-center justify-center">
                          {invoiceForm.qrCodeUrl ? (
                            <img
                              src={invoiceForm.qrCodeUrl}
                              alt="UPI QR Preview"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-zinc-400 text-[10px]">No QR</span>
                          )}
                        </div>
                        <span className="font-mono text-[9px] text-[#D4AF37] mt-2 truncate max-w-[140px]">{invoiceForm.upiId}</span>
                      </div>
                    </div>
                  </div>

                  {/* 9. AUTHORISED SIGNATORY CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          9. Authorised Signatory
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInvoiceForm((prev: any) => ({ ...prev, signatureUrl: '' }))}
                        className="text-[9px] text-[#D4AF37] hover:underline uppercase tracking-wider flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> Restore Default
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs">
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">
                          Custom Signature Image URL (Leave blank to use default signature)
                        </label>
                        <input
                          type="url"
                          value={invoiceForm.signatureUrl}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, signatureUrl: e.target.value }))}
                          placeholder="https://res.cloudinary.com/..."
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                        <span className="text-gray-500 text-[9px]">
                          Label rendered below signature: <strong>Authorised Signatory</strong>
                        </span>
                      </div>

                      {/* Signature Preview */}
                      <div className="flex flex-col items-center justify-center p-3 bg-white text-zinc-900 border border-zinc-200">
                        <div className="h-12 flex items-center justify-center">
                          <img
                            src={invoiceForm.signatureUrl || '/images/signature.jpg'}
                            alt="Signature Preview"
                            className="max-h-11 object-contain"
                            onError={(e: any) => {
                              e.target.src = '/images/signature.jpg';
                            }}
                          />
                        </div>
                        <div className="w-28 h-[1px] bg-zinc-300 my-1" />
                        <span className="text-[8.5px] text-zinc-600 uppercase tracking-wider">Authorised Signatory</span>
                      </div>
                    </div>
                  </div>

                  {/* 10. INVOICE COLOUR THEME CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                          10. Invoice Colour Theme
                        </h4>
                      </div>
                      <span className="text-[10px] text-[#D4AF37] font-semibold uppercase">
                        Active: {getInvoiceTheme(invoiceForm.invoiceTheme).name}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {INVOICE_THEME_LIST.map((th) => {
                        const isSelected = (invoiceForm.invoiceTheme || 'purple') === th.id;
                        return (
                          <button
                            key={th.id}
                            type="button"
                            onClick={() => setInvoiceForm((prev: any) => ({ ...prev, invoiceTheme: th.id }))}
                            className={`flex flex-col gap-2 p-3 border text-left transition-all relative ${
                              isSelected
                                ? 'border-[#D4AF37] bg-white/10 ring-2 ring-[#D4AF37] shadow-lg'
                                : 'border-white/10 bg-black/40 hover:border-white/30 text-gray-400 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="h-4 w-4 rounded-full inline-block shadow border border-white/20"
                                style={{ backgroundColor: th.primary }}
                              />
                              {isSelected && (
                                <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-bold block text-white">{th.name}</span>
                              <span className="text-[9px] font-mono text-gray-400">{th.primary}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 11. NOTES & TERMS CARD */}
                  <div className="bg-[#0f0f0f] border border-white/10 p-5 sm:p-6 shadow-md mb-24">
                    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/5">
                      <FileText className="h-4 w-4 text-[#D4AF37]" />
                      <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
                        11. Summary Notes & Terms
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Invoice Summary Notes</label>
                        <textarea
                          rows={3}
                          value={invoiceForm.notes}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, notes: e.target.value }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-widest text-[8px]">Terms & Conditions</label>
                        <textarea
                          rows={3}
                          value={invoiceForm.terms}
                          onChange={(e) => setInvoiceForm((prev: any) => ({ ...prev, terms: e.target.value }))}
                          className="bg-[#0a0a0a] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: STICKY LIVE PDF PREVIEW (5 cols) */}
                <div className={`xl:col-span-5 ${showLivePreviewMobile ? 'flex' : 'hidden xl:flex'} flex-col gap-3 sticky top-16 self-start max-h-[calc(100vh-120px)] overflow-y-auto`}>
                  {(() => {
                    const activeTheme = getInvoiceTheme(invoiceForm.invoiceTheme || 'purple');
                    const bBy = invoiceForm.billedBy;
                    const bTo = invoiceForm.billedTo;
                    const subtotalVal = Number(invoiceForm.subtotal || 0);
                    const totalTaxVal = Number(invoiceForm.tax || 0);
                    const cgstVal = Number(invoiceForm.cgst || (totalTaxVal / 2));
                    const sgstVal = Number(invoiceForm.sgst || (totalTaxVal / 2));
                    const grandTotalVal = Number(invoiceForm.total || 0);
                    const paidVal = Number(invoiceForm.paidAmount || 0);
                    const balanceVal = Number(invoiceForm.balanceAmount || 0);
                    const statusVal = invoiceForm.status || 'Draft';

                    return (
                      <div className="flex flex-col gap-3 w-full">
                        {/* Live Preview Bar */}
                        <div className="flex items-center justify-between bg-[#111111] px-4 py-2.5 border border-white/10 text-xs">
                          <div className="flex items-center gap-2">
                            <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Live Document Preview:</span>
                            <span className="font-bold flex items-center gap-1.5 text-[11px]" style={{ color: activeTheme.primary }}>
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeTheme.primary }} />
                              {activeTheme.name}
                            </span>
                          </div>
                          <span className="text-gray-500 text-[9px] uppercase tracking-widest">
                            A4 Proportional
                          </span>
                        </div>

                        {/* Exact Reference-Matched Invoice Document Container */}
                        <div className="bg-white text-zinc-900 p-6 sm:p-7 border border-zinc-300 shadow-2xl rounded-none font-sans text-xs flex flex-col gap-4 select-none relative">
                          
                          {/* 1. Header */}
                          <div className="flex justify-between items-start">
                            <div>
                              <h1 className="font-serif text-3xl font-extrabold tracking-tight" style={{ color: activeTheme.primary }}>
                                Invoice
                              </h1>
                              <div className="mt-2.5 flex flex-col gap-1 text-[10px]">
                                <div className="flex items-center gap-3">
                                  <span className="text-zinc-500 w-20">Invoice No</span>
                                  <strong className="text-zinc-900 font-mono">{invoiceForm.invoiceNumber || 'DB056'}</strong>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-zinc-500 w-20">Invoice Date</span>
                                  <span className="text-zinc-900">{invoiceForm.issueDate || 'YYYY-MM-DD'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-zinc-500 w-20">Created By</span>
                                  <span className="text-zinc-900">{invoiceForm.createdBy || BILLED_BY_DETAILS.name}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <span
                                className="px-3 py-1 text-[8.5px] font-bold tracking-wider uppercase border inline-block"
                                style={{
                                  backgroundColor: activeTheme.lightBackground,
                                  borderColor: activeTheme.border,
                                  color: statusVal === 'Paid' ? '#059669' : activeTheme.primary
                                }}
                              >
                                {statusVal}
                              </span>
                            </div>
                          </div>

                          {/* 2. Side-by-Side Billing Cards */}
                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            {/* Billed By Card */}
                            <div
                              className="p-3 border flex flex-col gap-0.5 leading-snug"
                              style={{ backgroundColor: activeTheme.lightBackground, borderColor: activeTheme.border }}
                            >
                              <span className="font-bold text-[10.5px] mb-0.5" style={{ color: activeTheme.primary }}>
                                Billed By
                              </span>
                              <strong className="text-zinc-900 font-semibold">{bBy.name}</strong>
                              <span className="text-zinc-600 line-clamp-1">{bBy.addressLine1}</span>
                              <span className="text-zinc-600 line-clamp-1">{bBy.city}</span>
                              <span className="text-zinc-600 line-clamp-1">{bBy.state}, {bBy.country} - {bBy.pinCode}</span>
                              <span className="text-zinc-800 font-medium">PAN: {bBy.pan}</span>
                              <span className="text-zinc-700 truncate">Email: {bBy.email}</span>
                              <span className="text-zinc-700">Phone: {bBy.phone}</span>
                            </div>

                            {/* Billed To Card */}
                            <div
                              className="p-3 border flex flex-col gap-0.5 leading-snug"
                              style={{ backgroundColor: activeTheme.lightBackground, borderColor: activeTheme.border }}
                            >
                              <span className="font-bold text-[10.5px] mb-0.5" style={{ color: activeTheme.primary }}>
                                Billed To
                              </span>
                              <strong className="text-zinc-900 font-semibold truncate">
                                {bTo.clientName || 'Valued Client'}
                              </strong>
                              {bTo.companyName && bTo.companyName !== bTo.clientName && (
                                <span className="text-zinc-600 font-medium line-clamp-1">{bTo.companyName}</span>
                              )}
                              <span className="text-zinc-600 line-clamp-1">{bTo.addressLine1 || 'Client Address'}</span>
                              <span className="text-zinc-600 line-clamp-1">{bTo.city || 'Hyderabad'}, {bTo.state || 'Telangana'}</span>
                              <span className="text-zinc-700 truncate">Email: {bTo.email || 'N/A'}</span>
                              <span className="text-zinc-700">Phone: {bTo.phone || 'N/A'}</span>
                              {bTo.gstin && <span className="text-zinc-800 font-medium">GSTIN: {bTo.gstin}</span>}
                            </div>
                          </div>

                          {/* 3. Reference 8-Column Items Table */}
                          <div className="border border-zinc-200 overflow-hidden text-[9.5px]">
                            <div
                              className="grid grid-cols-12 text-white font-bold p-2 text-center"
                              style={{ backgroundColor: activeTheme.primary }}
                            >
                              <span className="col-span-1">#</span>
                              <span className="col-span-4 text-left">Item / Description</span>
                              <span className="col-span-1">GST</span>
                              <span className="col-span-1">Qty</span>
                              <span className="col-span-1 text-right">Rate</span>
                              <span className="col-span-1 text-right">Amount</span>
                              <span className="col-span-1 text-right">CGST</span>
                              <span className="col-span-1 text-right">SGST</span>
                              <span className="col-span-1 text-right">Total</span>
                            </div>

                            <div className="divide-y divide-zinc-200">
                              {invoiceForm.items.map((item: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-12 p-2 items-start text-center">
                                  <span className="col-span-1 text-zinc-500">{idx + 1}</span>
                                  <div className="col-span-4 text-left flex flex-col pr-1">
                                    <strong className="text-zinc-900 font-semibold">{item.serviceName || 'Service'}</strong>
                                    {item.description && (
                                      <p className="text-zinc-500 text-[8.5px] mt-0.5 whitespace-pre-line leading-tight">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <span className="col-span-1 text-zinc-700">{item.gstRate || 0}%</span>
                                  <span className="col-span-1 text-zinc-800">{item.quantity}</span>
                                  <span className="col-span-1 text-right font-mono text-zinc-800">
                                    ₹{Number(item.rate !== undefined ? item.rate : item.price || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className="col-span-1 text-right font-mono text-zinc-800">
                                    ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className="col-span-1 text-right font-mono text-zinc-600">
                                    ₹{Number(item.cgst || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className="col-span-1 text-right font-mono text-zinc-600">
                                    ₹{Number(item.sgst || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className="col-span-1 text-right font-mono font-bold text-zinc-900">
                                    ₹{Number(item.total || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 4. Bottom 3-Section Layout (Bank Details | UPI QR | Totals & Signature) */}
                          <div className="grid grid-cols-12 gap-3 pt-2 items-stretch text-[9.5px]">
                            {/* Block 1: Bank Details */}
                            <div
                              className="col-span-4 p-2.5 border flex flex-col justify-between"
                              style={{ backgroundColor: activeTheme.lightBackground, borderColor: activeTheme.border }}
                            >
                              <span className="font-bold text-[10px] mb-1.5" style={{ color: activeTheme.primary }}>
                                Bank Details
                              </span>
                              <div className="flex flex-col gap-1 text-[8.5px]">
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Account Name</span>
                                  <strong className="text-zinc-800 font-semibold">{invoiceForm.bankDetails.accountName}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Account No</span>
                                  <strong className="text-zinc-900 font-mono">{invoiceForm.bankDetails.accountNumber}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">IFSC</span>
                                  <strong className="text-zinc-900 font-mono">{invoiceForm.bankDetails.ifsc}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Account Type</span>
                                  <span className="text-zinc-700">{invoiceForm.bankDetails.accountType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Bank</span>
                                  <span className="text-zinc-700">{invoiceForm.bankDetails.bankName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Branch</span>
                                  <span className="text-zinc-700">{invoiceForm.bankDetails.branch}</span>
                                </div>
                              </div>
                            </div>

                            {/* Block 2: UPI QR Center */}
                            <div className="col-span-4 flex flex-col items-center justify-center p-2 text-center border border-zinc-200">
                              <span className="font-bold text-[9.5px] uppercase tracking-wider" style={{ color: activeTheme.primary }}>
                                {invoiceForm.upiInstruction || 'Scan to pay via UPI'}
                              </span>
                              <span className="text-zinc-400 text-[7px] leading-tight my-1 max-w-[130px]">
                                {invoiceForm.upiNote || 'Maximum of 1 lakh can be transferred via upi in a single day.'}
                              </span>
                              <div className="w-16 h-16 bg-white p-1 border border-zinc-300 flex items-center justify-center my-0.5">
                                <img
                                  src={invoiceForm.qrCodeUrl || DEFAULT_UPI_DETAILS.qrCodeUrl}
                                  alt="UPI QR Code"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span className="font-bold text-zinc-900 text-[8.5px] font-mono mt-0.5 truncate max-w-[125px]">
                                {invoiceForm.upiId || DEFAULT_UPI_DETAILS.upiId}
                              </span>
                            </div>

                            {/* Block 3: Totals & Signature */}
                            <div className="col-span-4 flex flex-col justify-between">
                              <div className="flex flex-col gap-1 text-[9px]">
                                <div className="flex justify-between text-zinc-600">
                                  <span>Amount</span>
                                  <span className="font-mono text-zinc-900">₹{subtotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-zinc-600">
                                  <span>CGST</span>
                                  <span className="font-mono text-zinc-900">₹{cgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-zinc-600">
                                  <span>SGST</span>
                                  <span className="font-mono text-zinc-900">₹{sgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {invoiceForm.discount > 0 && (
                                  <div className="flex justify-between text-rose-600">
                                    <span>Discount</span>
                                    <span className="font-mono">-₹{Number(invoiceForm.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                                <div
                                  className="flex justify-between font-bold py-1 border-y my-0.5 text-[10px]"
                                  style={{ borderColor: activeTheme.border, color: activeTheme.primary }}
                                >
                                  <span>Total (INR)</span>
                                  <span className="font-mono text-xs">₹{grandTotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-emerald-700 text-[8.5px]">
                                  <span>Amount Paid:</span>
                                  <span className="font-mono font-medium">₹{paidVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-amber-700 font-bold text-[9px]">
                                  <span>Balance Due:</span>
                                  <span className="font-mono">₹{balanceVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>

                              {/* Authorised Signatory */}
                              <div className="flex flex-col items-center mt-2">
                                <div className="h-8 flex items-center justify-center">
                                  <img
                                    src={invoiceForm.signatureUrl || '/images/signature.jpg'}
                                    alt="Authorised Signatory"
                                    className="max-h-7 object-contain"
                                    onError={(e: any) => {
                                      e.target.src = '/images/signature.jpg';
                                    }}
                                  />
                                </div>
                                <div className="w-24 h-[1px] bg-zinc-300 my-0.5" />
                                <span className="text-[7.5px] text-zinc-500 uppercase tracking-wider">Authorised Signatory</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* STICKY BOTTOM ACTION BAR */}
              <div className="sticky bottom-0 z-30 bg-[#0c0c0c] border-t border-[#D4AF37]/30 p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-gray-400">
                    Grand Total: <strong className="text-white text-sm">₹{Number(invoiceForm.total || 0).toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="text-emerald-400">
                    Paid: <strong>₹{Number(invoiceForm.paidAmount || 0).toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="text-amber-400">
                    Balance Due: <strong>₹{Number(invoiceForm.balanceAmount || 0).toLocaleString('en-IN')}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 justify-end w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowLivePreviewMobile(!showLivePreviewMobile)}
                    className="xl:hidden px-3.5 py-2 border border-white/20 hover:border-white text-gray-300 hover:text-white uppercase tracking-wider text-[10px] transition-all flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#D4AF37]" /> {showLivePreviewMobile ? 'Form' : 'Preview'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="px-4 py-2 border border-white/10 hover:border-white text-gray-400 hover:text-white uppercase tracking-wider text-[10px] transition-all"
                  >
                    Cancel
                  </button>

                  {invoiceForm.id && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDownloadThemeModalInvoice(invoiceForm);
                          setDownloadThemeSelected(invoiceForm.invoiceTheme || 'purple');
                        }}
                        className="px-3.5 py-2 border border-white/20 hover:border-white text-gray-300 hover:text-white uppercase tracking-wider text-[10px] transition-all flex items-center gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5 text-[#D4AF37]" /> Download PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSendInvoiceModalInvoice(invoiceForm);
                          setSendInvoiceThemeSelected(invoiceForm.invoiceTheme || 'purple');
                        }}
                        className="px-3.5 py-2 border border-white/20 hover:border-white text-gray-300 hover:text-white uppercase tracking-wider text-[10px] transition-all flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5 text-[#D4AF37]" /> Send Invoice
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleSaveInvoice('Draft')}
                    className="px-4 py-2 border border-white/20 hover:border-white text-gray-300 hover:text-white uppercase tracking-wider text-[10px] font-semibold transition-all"
                  >
                    Save Draft
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleSaveInvoice()}
                    className="px-5 py-2 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider text-[10px] transition-all flex items-center gap-1.5 shadow"
                  >
                    <Save className="h-3.5 w-3.5" /> {actionLoading ? 'Compiling...' : invoiceForm.id ? 'Save Invoice' : 'Compile & Save Invoice'}
                  </button>
                </div>
              </div>

            </div>
          )}
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

      {/* THEME DOWNLOAD MODAL */}
      {downloadThemeModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/40 max-w-lg w-full p-6 sm:p-8 font-sans text-xs relative text-white flex flex-col gap-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setDownloadThemeModalInvoice(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[#D4AF37] font-semibold uppercase tracking-wider text-[10px]">
                <Printer className="h-4 w-4" />
                <span>Download Invoice PDF</span>
              </div>
              <h3 className="font-serif text-xl text-white mt-1">
                Invoice {downloadThemeModalInvoice.invoiceNumber}
              </h3>
              <p className="text-gray-400 text-[11px] mt-0.5">
                Client: {downloadThemeModalInvoice.clientName || 'N/A'} • Saved Theme: <span className="text-[#D4AF37] font-semibold uppercase">{INVOICE_THEMES[downloadThemeModalInvoice.invoiceTheme || 'purple']?.name || 'Purple'}</span>
              </p>
            </div>

            {/* Theme Selector */}
            <div className="bg-white/[0.02] border border-white/10 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-semibold uppercase tracking-widest text-[9px]">
                  Select Color Theme
                </span>
                <span className="text-[11px] text-[#D4AF37] font-bold">
                  {INVOICE_THEMES[downloadThemeSelected]?.name}
                </span>
              </div>

              {/* Theme Buttons with Swatches */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INVOICE_THEME_LIST.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDownloadThemeSelected(t.id)}
                    className={`flex items-center gap-2 p-2 border transition-all text-left ${
                      downloadThemeSelected === t.id
                        ? 'border-[#D4AF37] bg-white/10 text-white font-bold ring-1 ring-[#D4AF37]'
                        : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30 bg-black/40'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/20"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span className="text-[11px] truncate">{t.name}</span>
                  </button>
                ))}
              </div>

              {/* Theme Dropdown Alternative */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <label htmlFor="theme-dropdown-select" className="text-gray-400 text-[9px] uppercase tracking-wider">
                  Theme:
                </label>
                <select
                  id="theme-dropdown-select"
                  value={downloadThemeSelected}
                  onChange={(e) => setDownloadThemeSelected(e.target.value)}
                  className="bg-[#111111] border border-white/20 text-white px-2 py-1 text-xs focus:outline-none focus:border-[#D4AF37] flex-1"
                >
                  {INVOICE_THEME_LIST.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} Theme ({t.primary})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Primary Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href={`/invoices/${downloadThemeModalInvoice.invoiceNumber}.pdf?theme=${downloadThemeSelected}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-center text-xs"
              >
                <Printer className="h-4 w-4" /> Download Selected ({INVOICE_THEMES[downloadThemeSelected]?.name})
              </a>

              <button
                type="button"
                onClick={() => handleDownloadAllThemes(downloadThemeModalInvoice.invoiceNumber)}
                className="flex-1 py-3 border border-white/20 hover:border-white text-gray-200 hover:text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-center text-xs bg-white/5"
              >
                <Copy className="h-4 w-4" /> Download All Themes (8 PDFs)
              </button>
            </div>

            {/* Download with Current Saved Theme */}
            {downloadThemeModalInvoice.invoiceTheme && downloadThemeSelected !== downloadThemeModalInvoice.invoiceTheme && (
              <a
                href={`/invoices/${downloadThemeModalInvoice.invoiceNumber}.pdf?theme=${downloadThemeModalInvoice.invoiceTheme}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 border border-white/10 hover:border-white text-gray-400 hover:text-white uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-center text-[10px]"
              >
                Download with Original Saved Theme ({INVOICE_THEMES[downloadThemeModalInvoice.invoiceTheme]?.name || 'Purple'})
              </a>
            )}

            {/* Direct 1-Click Multi-Color Download Links */}
            <div className="border-t border-white/10 pt-3">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-2">
                1-Click Direct Download Options:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {INVOICE_THEME_LIST.map((t) => (
                  <a
                    key={t.id}
                    href={`/invoices/${downloadThemeModalInvoice.invoiceNumber}.pdf?theme=${t.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 hover:border-white/30 text-gray-400 hover:text-white text-[10px] transition-all"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.primary }} />
                    <span className="truncate">Download {t.name} Invoice</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDownloadThemeModalInvoice(null)}
                className="px-4 py-2 border border-white/10 hover:border-white text-gray-400 hover:text-white uppercase tracking-wider text-[10px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND INVOICE MODAL (WITH THEME SELECTION & ATTACHMENT PREVIEW) */}
      {sendInvoiceModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/40 max-w-lg w-full p-6 sm:p-8 font-sans text-xs relative text-white flex flex-col gap-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setSendInvoiceModalInvoice(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[#D4AF37] font-semibold uppercase tracking-wider text-[10px]">
                <Send className="h-4 w-4" />
                <span>Send Invoice Email</span>
              </div>
              <h3 className="font-serif text-xl text-white mt-1">
                Invoice {sendInvoiceModalInvoice.invoiceNumber}
              </h3>
              <p className="text-gray-400 text-[11px] mt-0.5">
                Send the compiled PDF invoice directly to the client with your selected theme.
              </p>
            </div>

            {/* Email Metadata Card */}
            <div className="bg-white/[0.03] border border-white/10 p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">To (Client Email)</label>
                <div className="px-3 py-2 bg-[#111111] border border-white/15 text-white font-mono text-xs flex items-center justify-between">
                  <span>{sendInvoiceModalInvoice.billedTo?.email || sendInvoiceModalInvoice.clientId?.email || sendInvoiceModalInvoice.clientEmail || 'Client email not set'}</span>
                  <span className="text-[10px] text-zinc-500 font-sans">{sendInvoiceModalInvoice.billedTo?.clientName || sendInvoiceModalInvoice.clientName}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">Subject</label>
                <div className="px-3 py-2 bg-[#111111] border border-white/15 text-white text-xs">
                  Invoice {sendInvoiceModalInvoice.invoiceNumber} from Frame by DB
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 uppercase tracking-widest text-[8.5px] font-semibold">Attachment</label>
                <div className="px-3 py-2 bg-[#111111] border border-white/15 text-[#D4AF37] font-mono text-xs flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>{sendInvoiceModalInvoice.invoiceNumber}-{sendInvoiceThemeSelected}.pdf</span>
                </div>
              </div>
            </div>

            {/* Select Theme for Email Attachment */}
            <div className="bg-white/[0.02] border border-white/10 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-semibold uppercase tracking-widest text-[9px]">
                  Select Color Theme For Attachment
                </span>
                <span className="text-[11px] text-[#D4AF37] font-bold">
                  {INVOICE_THEMES[sendInvoiceThemeSelected]?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INVOICE_THEME_LIST.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSendInvoiceThemeSelected(t.id)}
                    className={`flex items-center gap-2 p-2 border transition-all text-left ${
                      sendInvoiceThemeSelected === t.id
                        ? 'border-[#D4AF37] bg-white/10 text-white font-bold ring-1 ring-[#D4AF37]'
                        : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30 bg-black/40'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/20"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span className="text-[11px] truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSendInvoiceModalInvoice(null)}
                className="px-4 py-2 border border-white/10 hover:border-white text-gray-400 hover:text-white uppercase tracking-wider text-[10px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleSendInvoiceWithTheme(sendInvoiceModalInvoice.id || sendInvoiceModalInvoice._id, sendInvoiceThemeSelected)}
                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 shadow"
              >
                <Send className="h-4 w-4" /> {actionLoading ? 'Sending Email...' : 'Send Invoice Email'}
              </button>
            </div>
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
                    name="businessName"
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
                    name="founderName"
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
                    name="founderImage"
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
                    name="phone"
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
                    name="email"
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
                    name="experienceYears"
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
                  name="logoUrl"
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
                  name="location"
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
                    name="bankName"
                    type="text"
                    value={siteSettings.bankName || ''}
                    onChange={(e) => handleSettingsFieldChange('bankName', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. State Bank"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-ac-number" className="text-gray-400 uppercase tracking-widest text-[9px]">Bank Account Number</label>
                  <input
                    id="settings-ac-number"
                    name="accountNumber"
                    type="text"
                    value={siteSettings.accountNumber || ''}
                    onChange={(e) => handleSettingsFieldChange('accountNumber', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. 36300863175"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-ifsc" className="text-gray-400 uppercase tracking-widest text-[9px]">IFSC Code</label>
                  <input
                    id="settings-ifsc"
                    name="ifscCode"
                    type="text"
                    value={siteSettings.ifscCode || ''}
                    onChange={(e) => handleSettingsFieldChange('ifscCode', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. SBIN0018857"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-upi" className="text-gray-400 uppercase tracking-widest text-[9px]">UPI ID</label>
                  <input
                    id="settings-upi"
                    name="upiId"
                    type="text"
                    value={siteSettings.upiId || ''}
                    onChange={(e) => handleSettingsFieldChange('upiId', e.target.value)}
                    className="bg-[#111111] border border-white/10 px-4 py-2 text-white focus:outline-none"
                    placeholder="e.g. dasaribharadwaj@ybl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-gst" className="text-gray-400 uppercase tracking-widest text-[9px]">GST Number (Optional)</label>
                  <input
                    id="settings-gst"
                    name="gstNumber"
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
                    name="panNumber"
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
                    <p>
                      <strong>Budget:</strong>{' '}
                      <span className="text-[#D4AF37] font-bold">
                        {selectedBookingDetails.budget !== null && selectedBookingDetails.budget !== undefined && selectedBookingDetails.budget !== '' ? (
                          typeof selectedBookingDetails.budget === 'number' ? `₹${selectedBookingDetails.budget.toLocaleString('en-IN')}` : selectedBookingDetails.budget
                        ) : 'TBD'}
                      </span>
                    </p>
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
                      name="notes"
                      rows={3}
                      className="w-full bg-[#111111] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] font-sans"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={selectedBookingDetails.assignedTeam || ''}
                        placeholder="Assign team / camera crew..."
                        id={`team-input-${selectedBookingDetails.id}`}
                        name="assignedTeam"
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

            <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this booking request?')) {
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/bookings/${selectedBookingDetails.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        setBookings(bookings.filter(b => b.id !== selectedBookingDetails.id));
                        setSelectedBookingDetails(null);
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setActionLoading(false);
                    }
                  }
                }}
                disabled={actionLoading}
                className="px-5 py-2 border border-red-500/30 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-white uppercase tracking-wider transition-all font-sans"
              >
                Delete Request
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBookingDetails(null)}
                  className="px-5 py-2 border border-white/10 hover:border-white text-gray-400 hover:text-white uppercase tracking-wider transition-all font-sans"
                >
                  Keep / Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/bookings/${selectedBookingDetails.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Confirmed' })
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setBookings(bookings.map(b => b.id === selectedBookingDetails.id ? updated : b));
                        setSelectedBookingDetails(null);
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading || selectedBookingDetails.status === 'Confirmed'}
                  className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider transition-all font-sans"
                >
                  {selectedBookingDetails.status === 'Confirmed' ? 'Confirmed' : 'Accept & Confirm'}
                </button>
              </div>
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
                <label htmlFor="edit-booking-name" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Client Name</label>
                <input
                  id="edit-booking-name"
                  name="name"
                  type="text"
                  value={editingBooking.name || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-booking-email" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Email</label>
                  <input
                    id="edit-booking-email"
                    name="email"
                    type="email"
                    value={editingBooking.email || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-booking-phone" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Phone</label>
                  <input
                    id="edit-booking-phone"
                    name="phone"
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
                  <label htmlFor="edit-booking-date" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Event Date</label>
                  <input
                    id="edit-booking-date"
                    name="date"
                    type="text"
                    value={editingBooking.date || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-booking-location" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Location</label>
                  <input
                    id="edit-booking-location"
                    name="location"
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
                  <label htmlFor="edit-booking-eventtype" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Event Type</label>
                  <input
                    id="edit-booking-eventtype"
                    name="eventType"
                    type="text"
                    value={editingBooking.eventType || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, eventType: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-booking-budget" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Budget</label>
                  <input
                    id="edit-booking-budget"
                    name="budget"
                    type="text"
                    value={editingBooking.budget || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, budget: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-booking-status" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Status</label>
                  <select
                    id="edit-booking-status"
                    name="status"
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
                  <label htmlFor="edit-booking-assigned-team" className="text-gray-500 uppercase tracking-widest text-[8px] font-sans">Assigned Team</label>
                  <input
                    id="edit-booking-assigned-team"
                    name="assignedTeam"
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
      {/* RECORD PAYMENT MODAL */}
      {recordPaymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 max-w-lg w-full p-8 relative font-sans text-xs flex flex-col gap-6 text-white rounded-none">
            <button
              onClick={() => setRecordPaymentInvoice(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[#D4AF37] font-semibold uppercase tracking-wider text-xs">
                <CreditCard className="h-4 w-4" />
                <span>Record Invoice Payment</span>
              </div>
              <h3 className="font-serif text-xl text-white mt-1">
                Invoice {recordPaymentInvoice.invoiceNumber}
              </h3>
              <p className="text-gray-400 text-[11px] mt-0.5">
                Client: {recordPaymentInvoice.clientName || 'N/A'}
              </p>
            </div>

            {/* Invoice Breakdown Summary */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-white/[0.02] border border-white/10 text-center">
              <div>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Total Billed</span>
                <span className="font-semibold text-white">₹{Number(recordPaymentInvoice.total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Already Paid</span>
                <span className="font-semibold text-emerald-400">₹{Number(recordPaymentInvoice.paidAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Balance Due</span>
                <span className="font-semibold text-amber-400">₹{Number(recordPaymentInvoice.balanceAmount ?? (recordPaymentInvoice.total - (recordPaymentInvoice.paidAmount || 0))).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="record-payment-amount" className="text-gray-400 uppercase tracking-widest text-[9px]">
                    Payment Amount (₹) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const bal = Number(recordPaymentInvoice.balanceAmount ?? (recordPaymentInvoice.total - (recordPaymentInvoice.paidAmount || 0)));
                      setRecordPaymentForm((prev: any) => ({ ...prev, amount: bal > 0 ? bal : 0 }));
                    }}
                    className="text-[9px] text-[#D4AF37] hover:underline cursor-pointer uppercase"
                  >
                    Set Full Balance Due
                  </button>
                </div>
                <input
                  id="record-payment-amount"
                  type="number"
                  min="1"
                  max={recordPaymentInvoice.total}
                  value={recordPaymentForm.amount}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, amount: Number(e.target.value) })}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-white font-medium focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="record-payment-method" className="text-gray-400 uppercase tracking-widest text-[9px]">
                    Payment Method *
                  </label>
                  <select
                    id="record-payment-method"
                    value={recordPaymentForm.method}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, method: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="record-payment-date" className="text-gray-400 uppercase tracking-widest text-[9px]">
                    Payment Date *
                  </label>
                  <input
                    id="record-payment-date"
                    type="date"
                    value={recordPaymentForm.paymentDate}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, paymentDate: e.target.value })}
                    className="bg-[#111111] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="record-payment-txnid" className="text-gray-400 uppercase tracking-widest text-[9px]">
                  Transaction ID / UTR / Reference
                </label>
                <input
                  id="record-payment-txnid"
                  type="text"
                  placeholder="e.g. UPI Ref, IMPS UTR, or Cash receipt no."
                  value={recordPaymentForm.transactionId}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, transactionId: e.target.value })}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="record-payment-notes" className="text-gray-400 uppercase tracking-widest text-[9px]">
                  Internal Notes / Remark
                </label>
                <input
                  id="record-payment-notes"
                  type="text"
                  placeholder="e.g. Received via GPay / Advance 40% cleared"
                  value={recordPaymentForm.notes}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, notes: e.target.value })}
                  className="bg-[#111111] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setRecordPaymentInvoice(null)}
                  className="px-4 py-2 border border-white/10 text-gray-400 hover:text-white uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider transition-all"
                >
                  {actionLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE PAYMENT HISTORY MODAL */}
      {invoicePaymentsView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 max-w-2xl w-full p-8 relative font-sans text-xs flex flex-col gap-6 text-white rounded-none max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setInvoicePaymentsView(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[#D4AF37] font-semibold uppercase tracking-wider text-xs">
                <History className="h-4 w-4" />
                <span>Payment Records & History</span>
              </div>
              <h3 className="font-serif text-xl text-white mt-1">
                Invoice {invoicePaymentsView.invoiceNumber}
              </h3>
              <p className="text-gray-400 text-[11px] mt-0.5">
                Client: {invoicePaymentsView.clientName || 'N/A'} • Total: ₹{Number(invoicePaymentsView.total || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Summary card */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-white/[0.02] border border-white/10 text-center">
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Total Amount</span>
                <span className="text-lg font-serif text-white font-semibold">₹{Number(invoicePaymentsView.total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Amount Paid</span>
                <span className="text-lg font-serif text-emerald-400 font-semibold">₹{Number(invoicePaymentsView.paidAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-sans">Balance Due</span>
                <span className="text-lg font-serif text-amber-400 font-semibold">₹{Number(invoicePaymentsView.balanceAmount ?? (invoicePaymentsView.total - (invoicePaymentsView.paidAmount || 0))).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payments List */}
            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider text-[10px] mb-3">
                Transaction Logs ({adminPayments.filter((p) => 
                  p.invoiceNumber === invoicePaymentsView.invoiceNumber || 
                  p.invoiceId === invoicePaymentsView.id || 
                  p.invoiceId?._id === invoicePaymentsView.id
                ).length})
              </h4>
              {adminPayments.filter((p) => 
                p.invoiceNumber === invoicePaymentsView.invoiceNumber || 
                p.invoiceId === invoicePaymentsView.id || 
                p.invoiceId?._id === invoicePaymentsView.id
              ).length === 0 ? (
                <div className="p-6 border border-white/5 text-center text-gray-500">
                  No individual payment records logged yet for this invoice.
                </div>
              ) : (
                <div className="border border-white/10 divide-y divide-white/5">
                  {adminPayments
                    .filter((p) => 
                      p.invoiceNumber === invoicePaymentsView.invoiceNumber || 
                      p.invoiceId === invoicePaymentsView.id || 
                      p.invoiceId?._id === invoicePaymentsView.id
                    )
                    .map((pay) => (
                      <div key={pay.id || pay._id} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-400">₹{Number(pay.amount || 0).toLocaleString('en-IN')}</span>
                            <span className="text-gray-400">• {pay.method || 'Direct Payment'}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-semibold border ${
                              pay.status === 'Success' || pay.status === 'Approved' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                              pay.status === 'Pending' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                              'border-rose-500/30 text-rose-400 bg-rose-500/10'
                            }`}>
                              {pay.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                            Txn / UTR: <strong className="text-gray-300 font-mono">{pay.transactionId || 'None'}</strong> • {new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}
                          </span>
                          {pay.notes && (
                            <span className="text-[10px] text-gray-400 italic">Notes: {pay.notes}</span>
                          )}
                          {pay.rejectionReason && (
                            <span className="text-[10px] text-rose-400">Rejection: {pay.rejectionReason}</span>
                          )}
                        </div>
                        {pay.screenshotUrl && (
                          <a
                            href={pay.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#D4AF37] hover:underline flex items-center gap-1 text-[10px]"
                          >
                            Receipt <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  const inv = invoicePaymentsView;
                  setInvoicePaymentsView(null);
                  handleOpenRecordPaymentModal(inv);
                }}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-white text-[#111111] font-bold uppercase tracking-wider text-[10px]"
              >
                + Record New Payment
              </button>
              <button
                type="button"
                onClick={() => setInvoicePaymentsView(null)}
                className="px-4 py-2 border border-white/10 text-gray-400 hover:text-white uppercase tracking-wider text-[10px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[#0a0a0a] border border-rose-500/30 max-w-md w-full p-6 relative font-sans text-xs flex flex-col gap-4 text-white rounded-none">
            <button
              onClick={() => {
                setRejectingPayment(null);
                setRejectReason('');
              }}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-rose-400 font-semibold uppercase tracking-wider text-xs">
                <AlertCircle className="h-4 w-4" />
                <span>Reject Payment Confirmation</span>
              </div>
              <h3 className="font-serif text-lg text-white mt-1">
                Reject ₹{Number(rejectingPayment.amount || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-gray-400 text-[11px] mt-0.5">
                Invoice {rejectingPayment.invoiceNumber || rejectingPayment.invoiceId?.invoiceNumber || ''} • Txn: {rejectingPayment.transactionId || 'N/A'}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reject-reason-input" className="text-gray-400 uppercase tracking-widest text-[9px]">
                Reason for Rejection (Visible to Client)
              </label>
              <textarea
                id="reject-reason-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR mismatch with bank statement / Funds not credited..."
                className="bg-[#111111] border border-white/10 p-2.5 text-white focus:outline-none focus:border-rose-500 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setRejectingPayment(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-white/10 text-gray-400 hover:text-white uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectPayment}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
      
      {/* Footer modals / old settings markup */}
    </div>
  );
}
