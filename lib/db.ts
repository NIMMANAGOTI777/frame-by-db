import { prisma } from './prisma';
import { supabaseAdmin, getSupabaseUserByEmail } from './supabase';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Helper to convert Decimal types recursively to standard JavaScript numbers
export function convertDecimals<T>(obj: T): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Prisma.Decimal) return obj.toNumber();
  if (Array.isArray(obj)) return obj.map(convertDecimals);
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertDecimals(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// Interface definition for DB structure (backward compatibility)
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  billingAddress?: string;
  accessKey: string;
  authUserId?: string;
  downloads?: any;
  albumPhotos?: any;
  createdAt: any;
  updatedAt: any;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId?: string;
  clientId: string;
  issueDate: any;
  dueDate: any;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Pending' | 'Overdue' | 'Cancelled';
  notes?: string;
  createdAt: any;
  updatedAt: any;
  history?: any;
  items?: InvoiceItem[];
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
  paymentDate: any;
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

// Read database mock / aggregator for page-level rendering backward compatibility
export async function readDB(): Promise<DBStructure> {
  try {
    const settings = await prisma.setting.findFirst();
    const users = await prisma.user.findMany();
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    const testimonials = await prisma.testimonial.findMany();
    const faqs = await prisma.fAQ.findMany();
    const packages = await prisma.package.findMany();
    const blogs = await prisma.blog.findMany({ orderBy: { createdAt: 'desc' } });
    const portfolio = await prisma.portfolio.findMany();
    const gallery = await prisma.gallery.findMany();
    const clients = await prisma.client.findMany();
    const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
    const invoiceItems = await prisma.invoiceItem.findMany();
    const payments = await prisma.payment.findMany();

    const pricing = packages.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      period: 'Event',
      description: p.description,
      features: p.features,
      isRecommended: p.name.toLowerCase().includes('gold')
    }));

    return convertDecimals({
      settings: settings || {},
      users,
      bookings,
      testimonials,
      faqs,
      pricing,
      blogs,
      portfolio,
      gallery,
      clients,
      invoices,
      invoiceItems,
      payments
    });
  } catch (error: any) {
    console.error('Error aggregator reading database via Prisma:', error);
    try {
      const dbPath = path.join(process.cwd(), 'database', 'db.json');
      if (fs.existsSync(dbPath)) {
        console.warn("Using local JSON fallback for readDB during build/error phase.");
        const fileContent = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(fileContent);
      }
    } catch (fallbackError) {
      console.error("JSON fallback failed in readDB:", fallbackError);
    }
    throw new Error(`Database read failed: ${error.message || error}`);
  }
}

// Write database mock (not needed with Prisma direct writes, kept for backward compatibility signature)
export async function writeDB(data: DBStructure): Promise<void> {
  console.log('writeDB called - operations should be direct through Prisma client.');
}

// Helper methods for Bookings
export async function getBookings() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(bookings);
}

export async function addBooking(booking: any) {
  // Find or create client based on email
  let client = await prisma.client.findUnique({
    where: { email: booking.email }
  });

  const accessKey = booking.accessKey || `KEY-${Math.floor(1000 + Math.random() * 9000)}`;

  if (!client) {
    let authUserId = null;
    try {
      const existingUser = await getSupabaseUserByEmail(booking.email);
      if (existingUser) {
        authUserId = existingUser.id;
      } else {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: booking.email,
          password: accessKey,
          email_confirm: true,
          user_metadata: { role: 'client' }
        });
        if (createError) {
          console.error("Failed to create client auth user during booking:", createError);
        } else if (newUser && newUser.user) {
          authUserId = newUser.user.id;
        }
      }
    } catch (err) {
      console.error("Error creating Supabase user during booking:", err);
    }

    client = await prisma.client.create({
      data: {
        name: booking.name || '',
        email: booking.email,
        phone: booking.phone || '',
        accessKey,
        authUserId,
        companyName: '',
        billingAddress: booking.location || '',
        downloads: [],
        albumPhotos: []
      }
    });
  }

  let parsedBudget = null;
  if (booking.budget !== undefined && booking.budget !== null && booking.budget !== '') {
    parsedBudget = typeof booking.budget === 'number' ? booking.budget : parseFloat(String(booking.budget).replace(/[^0-9.]/g, ''));
  }

  const newBooking = await prisma.booking.create({
    data: {
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      date: new Date(booking.date),
      eventType: booking.eventType,
      location: booking.location,
      budget: parsedBudget,
      message: booking.message || null,
      status: 'New'
    }
  });

  return convertDecimals({
    ...newBooking,
    clientId: client.id
  });
}

export async function updateBookingStatus(id: string, status: string) {
  const updated = await prisma.booking.update({
    where: { id },
    data: { status }
  });
  return convertDecimals(updated);
}

export async function updateBooking(id: string, updatedFields: any) {
  const data = { ...updatedFields };
  if (data.date) data.date = new Date(data.date);
  if (data.budget !== undefined && data.budget !== null && data.budget !== '') {
    data.budget = typeof data.budget === 'number' ? data.budget : parseFloat(String(data.budget).replace(/[^0-9.]/g, ''));
  }
  delete data.id;
  delete data.clientId;
  delete data.createdAt;
  delete data.updatedAt;
  
  const updated = await prisma.booking.update({
    where: { id },
    data
  });
  return convertDecimals(updated);
}

export async function deleteBooking(id: string) {
  await prisma.booking.delete({
    where: { id }
  });
  return true;
}

export async function clearAllBookings() {
  await prisma.booking.deleteMany();
  return true;
}

// Helper methods for Blogs
export async function getBlogs() {
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(blogs);
}

export async function addBlog(blog: any) {
  const created = await prisma.blog.create({
    data: {
      title: blog.title,
      slug: blog.slug,
      summary: blog.summary,
      content: blog.content,
      category: blog.category,
      readTime: blog.readTime,
      image: blog.image,
      isFeatured: blog.isFeatured || false
    }
  });
  return convertDecimals(created);
}

export async function updateBlog(id: string, updatedFields: any) {
  const data = { ...updatedFields };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;

  const updated = await prisma.blog.update({
    where: { id },
    data
  });
  return convertDecimals(updated);
}

export async function deleteBlog(id: string) {
  await prisma.blog.delete({
    where: { id }
  });
  return true;
}

// Helper methods for Portfolio
export async function getPortfolio() {
  const portfolio = await prisma.portfolio.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(portfolio);
}

export async function addPortfolioItem(item: any) {
  const created = await prisma.portfolio.create({
    data: {
      title: item.title,
      client: item.client,
      category: item.category,
      location: item.location,
      date: new Date(item.date),
      image: item.image,
      videoUrl: item.videoUrl || null,
      details: item.details
    }
  });
  return convertDecimals(created);
}

export async function updatePortfolioItem(id: string, updatedFields: any) {
  const data = { ...updatedFields };
  if (data.date) data.date = new Date(data.date);
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;

  const updated = await prisma.portfolio.update({
    where: { id },
    data
  });
  return convertDecimals(updated);
}

export async function deletePortfolioItem(id: string) {
  await prisma.portfolio.delete({
    where: { id }
  });
  return true;
}

// Helper methods for Gallery
export async function getGallery() {
  const gallery = await prisma.gallery.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(gallery);
}

export async function addGalleryItem(item: any) {
  const created = await prisma.gallery.create({
    data: {
      title: item.title,
      category: item.category,
      image: item.image,
      type: item.type || 'image'
    }
  });
  return convertDecimals(created);
}

export async function deleteGalleryItem(id: string) {
  await prisma.gallery.delete({
    where: { id }
  });
  return true;
}

// Helper methods for FAQs
export async function getFAQs() {
  const faqs = await prisma.fAQ.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(faqs);
}

export async function addFAQ(faq: any) {
  const created = await prisma.fAQ.create({
    data: {
      question: faq.question,
      answer: faq.answer,
      category: faq.category
    }
  });
  return convertDecimals(created);
}

export async function updateFAQ(id: string, updatedFields: any) {
  const data = { ...updatedFields };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;

  const updated = await prisma.fAQ.update({
    where: { id },
    data
  });
  return convertDecimals(updated);
}

export async function deleteFAQ(id: string) {
  await prisma.fAQ.delete({
    where: { id }
  });
  return true;
}

// Helper methods for Testimonials
export async function getTestimonials() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(testimonials);
}

export async function addTestimonial(t: any) {
  const created = await prisma.testimonial.create({
    data: {
      name: t.name,
      role: t.role,
      content: t.content,
      rating: t.rating || 5,
      image: t.image
    }
  });
  return convertDecimals(created);
}

export async function updateTestimonial(id: string, updatedFields: any) {
  const data = { ...updatedFields };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;

  const updated = await prisma.testimonial.update({
    where: { id },
    data
  });
  return convertDecimals(updated);
}

export async function deleteTestimonial(id: string) {
  await prisma.testimonial.delete({
    where: { id }
  });
  return true;
}

// Helper methods for Pricing
export async function getPricing() {
  const packages = await prisma.package.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(
    packages.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      period: 'Event',
      description: p.description,
      features: p.features,
      isRecommended: p.name.toLowerCase().includes('gold')
    }))
  );
}

export async function updatePricing(id: string, updatedFields: any) {
  const data = { ...updatedFields };
  delete data.id;
  delete data.period;
  delete data.isRecommended;
  delete data.createdAt;
  delete data.updatedAt;

  const pkg = await prisma.package.update({
    where: { id },
    data
  });
  return convertDecimals({
    ...pkg,
    period: 'Event',
    isRecommended: pkg.name.toLowerCase().includes('gold')
  });
}

// Settings
export async function getSettings() {
  const settings = await prisma.setting.findFirst();
  return convertDecimals(settings);
}

export async function updateSettings(settings: any) {
  const first = await prisma.setting.findFirst();
  if (first) {
    const data = { ...settings };
    delete data.id;
    delete data.updatedAt;
    const updated = await prisma.setting.update({
      where: { id: first.id },
      data
    });
    return convertDecimals(updated);
  }
  return null;
}

// Users and auth
export async function getUsers() {
  const users = await prisma.user.findMany();
  return convertDecimals(users);
}

// Helper methods for Clients
export async function getClients() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(clients);
}

export async function getClientById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id }
  });
  return convertDecimals(client);
}

export async function getClientByAccessKey(accessKey: string) {
  const client = await prisma.client.findUnique({
    where: { accessKey }
  });
  return convertDecimals(client);
}

export async function addClient(clientData: Partial<Client>) {
  const accessKey = clientData.accessKey || `KEY-${Math.floor(1000 + Math.random() * 9000)}`;
  const email = clientData.email || '';

  let authUserId = clientData.authUserId || null;
  if (email) {
    try {
      const existingUser = await getSupabaseUserByEmail(email);
      if (existingUser) {
        authUserId = existingUser.id;
      } else {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: accessKey,
          email_confirm: true,
          user_metadata: { role: 'client' }
        });
        if (createError) {
          console.error("Failed to create client auth user:", createError);
        } else if (newUser && newUser.user) {
          authUserId = newUser.user.id;
        }
      }
    } catch (err) {
      console.error("Error provisioning client auth user:", err);
    }
  }

  const created = await prisma.client.create({
    data: {
      name: clientData.name || '',
      email,
      phone: clientData.phone || '',
      companyName: clientData.companyName || '',
      billingAddress: clientData.billingAddress || '',
      accessKey,
      authUserId,
      downloads: clientData.downloads || [],
      albumPhotos: clientData.albumPhotos || []
    }
  });
  return convertDecimals(created);
}

export async function updateClient(id: string, updatedFields: Partial<Client>) {
  const data = { ...updatedFields };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;

  const updated = await prisma.client.update({
    where: { id },
    data
  });
  return convertDecimals(updated);
}

export async function deleteClient(id: string) {
  await prisma.client.delete({
    where: { id }
  });
  return true;
}

// Helper methods for Invoices
export async function getInvoices() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(invoices);
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true, payments: true }
  });
  if (!invoice) return null;
  return convertDecimals(invoice);
}

export async function getInvoicesByClientId(clientId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' }
  });
  return convertDecimals(invoices);
}

export async function addInvoice(invoiceData: Partial<Invoice>, itemsData: Partial<InvoiceItem>[]) {
  const subtotal = itemsData.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const discount = Number(invoiceData.discount || 0);
  const tax = Number(invoiceData.tax || 0);
  const total = subtotal + tax - discount;
  const paidAmount = Number(invoiceData.paidAmount || 0);
  const balanceAmount = Math.max(0, total - paidAmount);
  
  const status = invoiceData.status || (balanceAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Pending' : 'Draft');
  const invoiceNumber = invoiceData.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const created = await prisma.invoice.create({
    data: {
      invoiceNumber,
      bookingId: invoiceData.bookingId || null,
      clientId: invoiceData.clientId || '',
      issueDate: invoiceData.issueDate ? new Date(invoiceData.issueDate) : new Date(),
      dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : new Date(),
      subtotal,
      tax,
      discount,
      total,
      paidAmount,
      balanceAmount,
      status,
      notes: invoiceData.notes || '',
      history: [
        { action: 'Invoice Generated', date: new Date().toISOString(), notes: 'Initial generation' }
      ] as any,
      items: {
        create: itemsData.map(item => ({
          serviceName: item.serviceName || 'Service',
          description: item.description || '',
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          tax: Number(item.tax || 0),
          total: Number(item.price || 0) * Number(item.quantity || 1)
        }))
      },
      payments: paidAmount > 0 ? {
        create: {
          amount: paidAmount,
          paymentMethod: 'Other',
          transactionId: 'INIT_PAY',
          paymentDate: new Date(),
          status: 'Success'
        }
      } : undefined
    },
    include: { items: true, payments: true }
  });

  return convertDecimals(created);
}

export async function updateInvoice(id: string, updatedFields: Partial<Invoice>, itemsData?: Partial<InvoiceItem>[]) {
  const oldInvoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!oldInvoice) throw new Error('Invoice not found');

  let subtotal = Number(oldInvoice.subtotal);
  const tax = updatedFields.tax !== undefined ? Number(updatedFields.tax) : Number(oldInvoice.tax);
  const discount = updatedFields.discount !== undefined ? Number(updatedFields.discount) : Number(oldInvoice.discount);

  if (itemsData) {
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id }
    });
    const createdItems = await Promise.all(
      itemsData.map(item =>
        prisma.invoiceItem.create({
          data: {
            invoiceId: id,
            serviceName: item.serviceName || 'Service',
            description: item.description || '',
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            tax: Number(item.tax || 0),
            total: Number(item.price || 0) * Number(item.quantity || 1)
          }
        })
      )
    );
    subtotal = createdItems.reduce((sum, item) => sum + Number(item.total), 0);
  }

  const total = subtotal + tax - discount;
  const paidAmount = updatedFields.paidAmount !== undefined ? Number(updatedFields.paidAmount) : Number(oldInvoice.paidAmount);
  const balanceAmount = Math.max(0, total - paidAmount);
  const status = updatedFields.status || (balanceAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Pending' : oldInvoice.status);

  const data: any = {
    ...updatedFields,
    subtotal,
    tax,
    discount,
    total,
    paidAmount,
    balanceAmount,
    status
  };
  if (data.issueDate) data.issueDate = new Date(data.issueDate);
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.items;
  delete data.payments;

  const updated = await prisma.invoice.update({
    where: { id },
    data,
    include: { items: true, payments: true }
  });

  return convertDecimals(updated);
}

export async function deleteInvoice(id: string) {
  await prisma.invoice.delete({
    where: { id }
  });
  return true;
}

export async function addInvoiceHistory(invoiceId: string, action: string, notes?: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });
  if (!invoice) return false;
  
  const history = Array.isArray(invoice.history) ? [...invoice.history] : [];
  history.push({
    action,
    date: new Date().toISOString(),
    notes
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { history: history as any }
  });
  return true;
}

// Helper methods for Payments
export async function getPayments() {
  const payments = await prisma.payment.findMany({
    orderBy: { paymentDate: 'desc' }
  });
  return convertDecimals(payments);
}

export async function addPayment(paymentData: Partial<Payment>) {
  const invoiceId = paymentData.invoiceId || '';
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });
  if (!invoice) throw new Error('Invoice not found');

  const amount = Number(paymentData.amount || 0);
  const paymentMethod = paymentData.paymentMethod || 'UPI';
  const transactionId = paymentData.transactionId || `TXN${Date.now()}`;
  const paymentDate = paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date();
  const status = paymentData.status || 'Success';

  const newPayment = await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      paymentMethod,
      transactionId,
      paymentDate,
      status
    }
  });

  if (status === 'Success') {
    const newPaidAmount = Number(invoice.paidAmount) + amount;
    const newBalanceAmount = Math.max(0, Number(invoice.total) - newPaidAmount);
    const newStatus = newBalanceAmount === 0 ? 'Paid' : 'Pending';

    const history = Array.isArray(invoice.history) ? [...invoice.history] : [];
    history.push({
      action: 'Payment Received',
      date: new Date().toISOString(),
      notes: `Recorded ${paymentMethod} payment of ₹${amount.toLocaleString('en-IN')}`
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newStatus,
        history: history as any
      }
    });
  }

  return convertDecimals(newPayment);
}
