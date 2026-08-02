import fs from 'fs';
import path from 'path';

// Define DB path
const dbPath = path.join(process.cwd(), 'database', 'db.json');

// Interface definition for DB structure
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  billingAddress?: string;
  accessKey: string;
  createdAt: string;
  updatedAt: string;
  albumPhotos?: string[];
  downloads?: Array<{ label: string; size: string; url: string }>;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId?: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Pending' | 'Overdue' | 'Cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  history?: Array<{ action: string; date: string; notes?: string }>;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  serviceName: string;
  description?: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
  status: 'Pending' | 'Success' | 'Failed';
}

export interface DBStructure {
  settings: any;
  users: any[];
  bookings: any[];
  testimonials: any[];
  faqs: any[];
  pricing: any[];
  blogs: any[];
  portfolio: any[];
  gallery: any[];
  clients: Client[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];
}

// Read database
export async function readDB(): Promise<DBStructure> {
  try {
    if (!fs.existsSync(dbPath)) {
      // Return basic structure if file doesn't exist
      return {
        settings: {},
        users: [],
        bookings: [],
        testimonials: [],
        faqs: [],
        pricing: [],
        blogs: [],
        portfolio: [],
        gallery: [],
        clients: [],
        invoices: [],
        invoiceItems: [],
        payments: []
      };
    }
    const data = await fs.promises.readFile(dbPath, 'utf8');
    const db: DBStructure = JSON.parse(data);
    
    let changed = false;
    if (!db.clients) { db.clients = []; changed = true; }
    if (!db.invoices) { db.invoices = []; changed = true; }
    if (!db.invoiceItems) { db.invoiceItems = []; changed = true; }
    if (!db.payments) { db.payments = []; changed = true; }
    if (!db.bookings) { db.bookings = []; changed = true; }
    if (!db.portfolio) { db.portfolio = []; changed = true; }
    if (!db.gallery) { db.gallery = []; changed = true; }
    if (!db.blogs) { db.blogs = []; changed = true; }
    if (!db.settings) { db.settings = {}; changed = true; }
    if (!db.users) { db.users = []; changed = true; }
    if (!db.testimonials) { db.testimonials = []; changed = true; }
    if (!db.faqs) { db.faqs = []; changed = true; }
    if (!db.pricing) { db.pricing = []; changed = true; }

    // Seed demo data if clients array is empty
    if (db.clients.length === 0) {
      console.log('Seeding initial client & invoice data...');
      
      const demoClient: Client = {
        id: 'c_ananya',
        name: 'Ananya Reddy',
        email: 'ananya.r@example.com',
        phone: '+91 99887 76655',
        companyName: 'Reddy Group',
        billingAddress: 'Reddy Mansion, Jubilee Hills, Hyderabad',
        accessKey: 'ANANYA-2026',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        albumPhotos: [
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1550005814-7243baa2e7b8?auto=format&fit=crop&q=80&w=300',
          'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=300'
        ],
        downloads: [
          { label: 'High-Resolution Edited Photo Stills (.ZIP)', size: '4.8 GB', url: '#' },
          { label: 'Cinematic Wedding Trailer (4K ProRes .MP4)', size: '1.2 GB', url: '#' }
        ]
      };

      const demoInvoice: Invoice = {
        id: 'inv_ananya',
        invoiceNumber: 'INV-2026-089',
        bookingId: 'b1',
        clientId: 'c_ananya',
        issueDate: '2026-07-16',
        dueDate: '2026-08-16',
        subtotal: 350000,
        tax: 0,
        discount: 0,
        total: 350000,
        paidAmount: 350000,
        balanceAmount: 0,
        status: 'Paid',
        notes: 'Thank you for choosing Frame by DB. Total amount cleared.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          { action: 'Invoice Generated', date: new Date().toISOString(), notes: 'Generated from booking b1' },
          { action: 'Sent to Client', date: new Date().toISOString() },
          { action: 'Payment Received', date: new Date().toISOString(), notes: 'UPI payment of ₹3,50,000 cleared' }
        ]
      };

      const demoItem: InvoiceItem = {
        id: 'item_ananya_1',
        invoiceId: 'inv_ananya',
        serviceName: 'Wedding Photography & Cinematic Film',
        description: 'Full 3-day luxury wedding coverage, cinematic trailer, 30-min film, master raw photos, and 2 luxury albums.',
        quantity: 1,
        price: 350000,
        tax: 0,
        total: 350000
      };

      const demoPayment: Payment = {
        id: 'p_ananya',
        invoiceId: 'inv_ananya',
        amount: 350000,
        paymentMethod: 'UPI',
        transactionId: 'TXN9876543210',
        paymentDate: new Date().toISOString(),
        status: 'Success'
      };

      db.clients.push(demoClient);
      db.invoices.push(demoInvoice);
      db.invoiceItems.push(demoItem);
      db.payments.push(demoPayment);
      changed = true;
    }

    if (changed) {
      await writeDB(db);
    }

    return db;
  } catch (error) {
    console.error('Error reading local database:', error);
    throw new Error('Database read failed');
  }
}

// Write database
export async function writeDB(data: DBStructure): Promise<void> {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing local database:', error);
    throw new Error('Database write failed');
  }
}

// Helper methods for Bookings
export async function getBookings() {
  const db = await readDB();
  return db.bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addBooking(booking: any) {
  const db = await readDB();
  const newBooking = {
    id: `b_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...booking
  };
  db.bookings.push(newBooking);
  await writeDB(db);
  return newBooking;
}

export async function updateBookingStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
  const db = await readDB();
  const index = db.bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    db.bookings[index].status = status;
    await writeDB(db);
    return db.bookings[index];
  }
  throw new Error('Booking not found');
}

export async function deleteBooking(id: string) {
  const db = await readDB();
  db.bookings = db.bookings.filter(b => b.id !== id);
  await writeDB(db);
  return true;
}

// Helper methods for Blogs
export async function getBlogs() {
  const db = await readDB();
  return db.blogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addBlog(blog: any) {
  const db = await readDB();
  const newBlog = {
    id: `blog_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...blog
  };
  db.blogs.push(newBlog);
  await writeDB(db);
  return newBlog;
}

export async function updateBlog(id: string, updatedFields: any) {
  const db = await readDB();
  const index = db.blogs.findIndex(b => b.id === id);
  if (index !== -1) {
    db.blogs[index] = { ...db.blogs[index], ...updatedFields };
    await writeDB(db);
    return db.blogs[index];
  }
  throw new Error('Blog post not found');
}

export async function deleteBlog(id: string) {
  const db = await readDB();
  db.blogs = db.blogs.filter(b => b.id !== id);
  await writeDB(db);
  return true;
}

// Helper methods for Portfolio
export async function getPortfolio() {
  const db = await readDB();
  return db.portfolio;
}

export async function addPortfolioItem(item: any) {
  const db = await readDB();
  const newItem = {
    id: `port_${Date.now()}`,
    ...item
  };
  db.portfolio.push(newItem);
  await writeDB(db);
  return newItem;
}

export async function updatePortfolioItem(id: string, updatedFields: any) {
  const db = await readDB();
  const index = db.portfolio.findIndex(p => p.id === id);
  if (index !== -1) {
    db.portfolio[index] = { ...db.portfolio[index], ...updatedFields };
    await writeDB(db);
    return db.portfolio[index];
  }
  throw new Error('Portfolio item not found');
}

export async function deletePortfolioItem(id: string) {
  const db = await readDB();
  db.portfolio = db.portfolio.filter(p => p.id !== id);
  await writeDB(db);
  return true;
}

// Helper methods for Gallery
export async function getGallery() {
  const db = await readDB();
  return db.gallery;
}

export async function addGalleryItem(item: any) {
  const db = await readDB();
  const newItem = {
    id: `g_${Date.now()}`,
    ...item
  };
  db.gallery.push(newItem);
  await writeDB(db);
  return newItem;
}

export async function deleteGalleryItem(id: string) {
  const db = await readDB();
  db.gallery = db.gallery.filter(g => g.id !== id);
  await writeDB(db);
  return true;
}

// Helper methods for FAQs
export async function getFAQs() {
  const db = await readDB();
  return db.faqs;
}

export async function addFAQ(faq: any) {
  const db = await readDB();
  const newFAQ = {
    id: `faq_${Date.now()}`,
    ...faq
  };
  db.faqs.push(newFAQ);
  await writeDB(db);
  return newFAQ;
}

export async function updateFAQ(id: string, updatedFields: any) {
  const db = await readDB();
  const index = db.faqs.findIndex(f => f.id === id);
  if (index !== -1) {
    db.faqs[index] = { ...db.faqs[index], ...updatedFields };
    await writeDB(db);
    return db.faqs[index];
  }
  throw new Error('FAQ not found');
}

export async function deleteFAQ(id: string) {
  const db = await readDB();
  db.faqs = db.faqs.filter(f => f.id !== id);
  await writeDB(db);
  return true;
}

// Helper methods for Testimonials
export async function getTestimonials() {
  const db = await readDB();
  return db.testimonials;
}

export async function addTestimonial(t: any) {
  const db = await readDB();
  const newT = {
    id: `t_${Date.now()}`,
    ...t
  };
  db.testimonials.push(newT);
  await writeDB(db);
  return newT;
}

export async function updateTestimonial(id: string, updatedFields: any) {
  const db = await readDB();
  const index = db.testimonials.findIndex(t => t.id === id);
  if (index !== -1) {
    db.testimonials[index] = { ...db.testimonials[index], ...updatedFields };
    await writeDB(db);
    return db.testimonials[index];
  }
  throw new Error('Testimonial not found');
}

export async function deleteTestimonial(id: string) {
  const db = await readDB();
  db.testimonials = db.testimonials.filter(t => t.id !== id);
  await writeDB(db);
  return true;
}

// Helper methods for Pricing
export async function getPricing() {
  const db = await readDB();
  return db.pricing;
}

export async function updatePricing(id: string, updatedFields: any) {
  const db = await readDB();
  const index = db.pricing.findIndex(p => p.id === id);
  if (index !== -1) {
    db.pricing[index] = { ...db.pricing[index], ...updatedFields };
    await writeDB(db);
    return db.pricing[index];
  }
  throw new Error('Pricing package not found');
}

// Settings
export async function getSettings() {
  const db = await readDB();
  return db.settings;
}

export async function updateSettings(settings: any) {
  const db = await readDB();
  db.settings = { ...db.settings, ...settings };
  await writeDB(db);
  return db.settings;
}

// Users and auth
export async function getUsers() {
  const db = await readDB();
  return db.users;
}

// Helper methods for Clients
export async function getClients() {
  const db = await readDB();
  return db.clients || [];
}

export async function getClientById(id: string) {
  const db = await readDB();
  return db.clients.find(c => c.id === id);
}

export async function getClientByAccessKey(accessKey: string) {
  const db = await readDB();
  return db.clients.find(c => c.accessKey.trim().toUpperCase() === accessKey.trim().toUpperCase());
}

export async function addClient(clientData: Partial<Client>) {
  const db = await readDB();
  const newClient: Client = {
    id: `c_${Date.now()}`,
    name: clientData.name || '',
    email: clientData.email || '',
    phone: clientData.phone || '',
    companyName: clientData.companyName || '',
    billingAddress: clientData.billingAddress || '',
    accessKey: clientData.accessKey || `KEY-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    albumPhotos: clientData.albumPhotos || [],
    downloads: clientData.downloads || []
  };
  db.clients.push(newClient);
  await writeDB(db);
  return newClient;
}

export async function updateClient(id: string, updatedFields: Partial<Client>) {
  const db = await readDB();
  const index = db.clients.findIndex(c => c.id === id);
  if (index !== -1) {
    db.clients[index] = {
      ...db.clients[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    await writeDB(db);
    return db.clients[index];
  }
  throw new Error('Client not found');
}

export async function deleteClient(id: string) {
  const db = await readDB();
  db.clients = db.clients.filter(c => c.id !== id);
  // Also clean up invoices, items, and payments
  const clientInvoices = db.invoices.filter(inv => inv.clientId === id);
  const invoiceIds = clientInvoices.map(inv => inv.id);
  db.invoices = db.invoices.filter(inv => inv.clientId !== id);
  db.invoiceItems = db.invoiceItems.filter(item => !invoiceIds.includes(item.invoiceId));
  db.payments = db.payments.filter(pm => !invoiceIds.includes(pm.invoiceId));
  await writeDB(db);
  return true;
}

// Helper methods for Invoices
export async function getInvoices() {
  const db = await readDB();
  return db.invoices || [];
}

export async function getInvoiceById(id: string) {
  const db = await readDB();
  const invoice = db.invoices.find(inv => inv.id === id);
  if (!invoice) return null;
  const items = db.invoiceItems.filter(item => item.invoiceId === id);
  const payments = db.payments.filter(pm => pm.invoiceId === id);
  return { ...invoice, items, payments };
}

export async function getInvoicesByClientId(clientId: string) {
  const db = await readDB();
  return db.invoices.filter(inv => inv.clientId === clientId);
}

export async function addInvoice(invoiceData: Partial<Invoice>, itemsData: Partial<InvoiceItem>[]) {
  const db = await readDB();
  const invoiceId = `inv_${Date.now()}`;
  
  const subtotal = itemsData.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const discount = Number(invoiceData.discount || 0);
  const tax = Number(invoiceData.tax || 0);
  const total = subtotal + tax - discount;
  const paidAmount = Number(invoiceData.paidAmount || 0);
  const balanceAmount = Math.max(0, total - paidAmount);
  
  const status = invoiceData.status || (balanceAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Pending' : 'Draft');

  const newInvoice: Invoice = {
    id: invoiceId,
    invoiceNumber: invoiceData.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    bookingId: invoiceData.bookingId,
    clientId: invoiceData.clientId || '',
    issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
    dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
    subtotal,
    tax,
    discount,
    total,
    paidAmount,
    balanceAmount,
    status: status as any,
    notes: invoiceData.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      { action: 'Invoice Generated', date: new Date().toISOString(), notes: 'Initial generation' }
    ]
  };

  const newItems = itemsData.map((item, idx) => ({
    id: `item_${invoiceId}_${idx}`,
    invoiceId,
    serviceName: item.serviceName || 'Service',
    description: item.description || '',
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
    tax: Number(item.tax || 0),
    total: Number(item.price || 0) * Number(item.quantity || 1)
  }));

  db.invoices.push(newInvoice);
  db.invoiceItems.push(...newItems);
  
  // If paidAmount is greater than 0, add a payment entry
  if (paidAmount > 0) {
    const newPayment: Payment = {
      id: `p_${Date.now()}`,
      invoiceId,
      amount: paidAmount,
      paymentMethod: 'Other',
      transactionId: 'INIT_PAY',
      paymentDate: new Date().toISOString(),
      status: 'Success'
    };
    db.payments.push(newPayment);
  }

  await writeDB(db);
  return { ...newInvoice, items: newItems };
}

export async function updateInvoice(id: string, updatedFields: Partial<Invoice>, itemsData?: Partial<InvoiceItem>[]) {
  const db = await readDB();
  const index = db.invoices.findIndex(inv => inv.id === id);
  if (index === -1) throw new Error('Invoice not found');

  const oldInvoice = db.invoices[index];
  
  let subtotal = oldInvoice.subtotal;
  const tax = updatedFields.tax !== undefined ? Number(updatedFields.tax) : oldInvoice.tax;
  const discount = updatedFields.discount !== undefined ? Number(updatedFields.discount) : oldInvoice.discount;

  if (itemsData) {
    // Replace items
    db.invoiceItems = db.invoiceItems.filter(item => item.invoiceId !== id);
    const newItems = itemsData.map((item, idx) => ({
      id: `item_${id}_${idx}_upd`,
      invoiceId: id,
      serviceName: item.serviceName || 'Service',
      description: item.description || '',
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      tax: Number(item.tax || 0),
      total: Number(item.price || 0) * Number(item.quantity || 1)
    }));
    db.invoiceItems.push(...newItems);
    subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
  }

  const total = subtotal + tax - discount;
  const paidAmount = updatedFields.paidAmount !== undefined ? Number(updatedFields.paidAmount) : oldInvoice.paidAmount;
  const balanceAmount = Math.max(0, total - paidAmount);
  const status = updatedFields.status || (balanceAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Pending' : oldInvoice.status);

  db.invoices[index] = {
    ...oldInvoice,
    ...updatedFields,
    subtotal,
    tax,
    discount,
    total,
    paidAmount,
    balanceAmount,
    status: status as any,
    updatedAt: new Date().toISOString()
  };

  await writeDB(db);
  return db.invoices[index];
}

export async function deleteInvoice(id: string) {
  const db = await readDB();
  db.invoices = db.invoices.filter(inv => inv.id !== id);
  db.invoiceItems = db.invoiceItems.filter(item => item.invoiceId !== id);
  db.payments = db.payments.filter(pm => pm.invoiceId !== id);
  await writeDB(db);
  return true;
}

export async function addInvoiceHistory(invoiceId: string, action: string, notes?: string) {
  const db = await readDB();
  const index = db.invoices.findIndex(inv => inv.id === invoiceId);
  if (index !== -1) {
    if (!db.invoices[index].history) db.invoices[index].history = [];
    db.invoices[index].history!.push({
      action,
      date: new Date().toISOString(),
      notes
    });
    await writeDB(db);
    return true;
  }
  return false;
}

// Helper methods for Payments
export async function getPayments() {
  const db = await readDB();
  return db.payments || [];
}

export async function addPayment(paymentData: Partial<Payment>) {
  const db = await readDB();
  const invoiceId = paymentData.invoiceId || '';
  const index = db.invoices.findIndex(inv => inv.id === invoiceId);
  if (index === -1) throw new Error('Invoice not found');

  const invoice = db.invoices[index];
  const newPayment: Payment = {
    id: `p_${Date.now()}`,
    invoiceId,
    amount: Number(paymentData.amount || 0),
    paymentMethod: paymentData.paymentMethod || 'UPI',
    transactionId: paymentData.transactionId || `TXN${Date.now()}`,
    paymentDate: paymentData.paymentDate || new Date().toISOString(),
    status: paymentData.status || 'Success'
  };

  db.payments.push(newPayment);

  // Re-calculate paidAmount and status
  if (newPayment.status === 'Success') {
    const newPaidAmount = invoice.paidAmount + newPayment.amount;
    const newBalanceAmount = Math.max(0, invoice.total - newPaidAmount);
    invoice.paidAmount = newPaidAmount;
    invoice.balanceAmount = newBalanceAmount;
    if (newBalanceAmount === 0) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Pending';
    }
    invoice.updatedAt = new Date().toISOString();
    
    if (!invoice.history) invoice.history = [];
    invoice.history.push({
      action: 'Payment Received',
      date: new Date().toISOString(),
      notes: `Recorded ${newPayment.paymentMethod} payment of ₹${newPayment.amount.toLocaleString('en-IN')}`
    });
  }

  await writeDB(db);
  return newPayment;
}

