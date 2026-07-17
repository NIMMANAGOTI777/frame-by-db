'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Lock, LayoutDashboard, Calendar, Camera, Images, FileText, Settings, 
  LogOut, CheckCircle2, XCircle, Trash2, Plus, Save, Award 
} from 'lucide-react';

export default function AdminClient() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'analytics' | 'bookings' | 'portfolio' | 'gallery' | 'blogs' | 'settings'>('analytics');
  const [bookings, setBookings] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({});
  
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
      const [bookRes, portRes, galRes, blogRes, setRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/portfolio'),
        fetch('/api/gallery'),
        fetch('/api/blogs'),
        fetch('/api/settings')
      ]);

      const [bookData, portData, galData, blogData, setData] = await Promise.all([
        bookRes.json(),
        portRes.json(),
        galRes.json(),
        blogRes.json(),
        setRes.json()
      ]);

      setBookings(bookData);
      setPortfolio(portData);
      setGallery(galData);
      setBlogs(blogData);
      setSiteSettings(setData);
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
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-[9px] uppercase tracking-widest text-gray-400">Password</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#111111] border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all rounded-none font-sans"
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
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 uppercase tracking-wider text-left border-l-2 transition-all ${
                activeTab === 'settings' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4 text-[#D4AF37]" /> Global Settings
            </button>
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
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-white">Lead & Booking Manager</h2>
              <p className="text-gray-400 mt-1">Review active booking request timelines and general inquiries.</p>
            </div>

            <div className="flex flex-col gap-6">
              {bookings.map((book) => (
                <div key={book.id} className="p-6 bg-[#0a0a0a] border border-white/5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex flex-col gap-2 max-w-xl">
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-lg text-white font-medium">{book.name}</h3>
                      <span className={`px-2.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase border ${
                        book.status === 'approved' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                        book.status === 'rejected' ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'
                      }`}>
                        {book.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 font-sans uppercase">
                      <span><strong>Phone:</strong> {book.phone}</span>
                      <span><strong>Email:</strong> {book.email}</span>
                      <span><strong>Date:</strong> {book.date}</span>
                      <span><strong>Budget:</strong> {book.budget || 'TBD'}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed font-light mt-1">
                      <strong>Details:</strong> {book.message || 'No description provided.'}
                    </p>
                    <span className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">Location: {book.location}</span>
                  </div>

                  <div className="flex items-center gap-3 border-t md:border-t-0 border-white/5 pt-4 md:pt-0 shrink-0 self-end md:self-center">
                    {book.status === 'pending' && (
                      <>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleBookingStatus(book.id, 'approved')}
                          className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-[#111111] font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleBookingStatus(book.id, 'rejected')}
                          className="px-3.5 py-2 border border-red-500/30 hover:border-red-500 hover:text-red-400 text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </>
                    )}
                    <button
                      disabled={actionLoading}
                      onClick={() => handleBookingDelete(book.id)}
                      className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-colors animate-all"
                      title="Delete Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {bookings.length === 0 && (
                <div className="text-center py-20 text-gray-500">No active bookings logs.</div>
              )}
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
      </main>
    </div>
  );
}
