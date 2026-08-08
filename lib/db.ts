import { connectToDatabase } from '@/lib/mongodb';
import { Setting, Portfolio, Gallery, Blog, FAQ, PackageModel, Testimonial } from '@/lib/models';

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

export function convertDecimals<T>(obj: T): any {
  return obj;
}

export async function readDB(): Promise<DBStructure> {
  try {
    await connectToDatabase();
    const [setObj, portfolioList, galleryList, blogList, faqList, pkgList, testimonialList] = await Promise.all([
      Setting.findOne().lean(),
      Portfolio.find().sort({ createdAt: -1 }).lean(),
      Gallery.find().sort({ createdAt: -1 }).lean(),
      Blog.find().sort({ createdAt: -1 }).lean(),
      FAQ.find().sort({ category: 1, createdAt: -1 }).lean(),
      PackageModel.find().sort({ createdAt: 1 }).lean(),
      Testimonial.find().sort({ createdAt: -1 }).lean()
    ]);

    const settings = setObj ? { ...setObj, id: (setObj as any)._id?.toString() } : {};
    const portfolio = (portfolioList || []).map((item: any) => ({ ...item, id: item._id?.toString() }));
    const gallery = (galleryList || []).map((item: any) => ({ ...item, id: item._id?.toString() }));
    const blogs = (blogList || []).map((item: any) => ({ ...item, id: item._id?.toString() }));
    const faqs = (faqList || []).map((item: any) => ({ ...item, id: item._id?.toString() }));
    const testimonials = (testimonialList || []).map((item: any) => ({ ...item, id: item._id?.toString() }));

    const pricing = (pkgList || []).map((p: any) => ({
      id: p._id?.toString(),
      name: p.name,
      price: p.price,
      period: 'Event',
      description: p.description,
      features: p.features,
      isRecommended: (p.name || '').toLowerCase().includes('gold')
    }));

    return {
      settings,
      users: [],
      bookings: [],
      testimonials,
      faqs,
      pricing,
      blogs,
      portfolio,
      gallery,
      clients: [],
      invoices: [],
      invoiceItems: [],
      payments: []
    };
  } catch (error: any) {
    console.error('Error reading database via MongoDB Atlas:', error);
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
}

export async function writeDB(data: DBStructure): Promise<void> {
  console.log('writeDB called');
}

export async function getSettings() {
  try {
    await connectToDatabase();
    const settings = await Setting.findOne().lean();
    if (settings) {
      return { ...settings, id: (settings as any)._id?.toString() };
    }
  } catch (err) {
    console.error('getSettings error:', err);
  }
  return {};
}

export async function getClients(): Promise<any> { return []; }
export async function getClientById(id: string): Promise<any> { return null; }
export async function addClient(clientData: any): Promise<any> { return {}; }
export async function updateClient(id: string, updatedFields: any): Promise<any> { return {}; }
export async function deleteClient(id: string): Promise<any> { return false; }
export async function getInvoices(): Promise<any> { return []; }
export async function getInvoiceById(id: string): Promise<any> { return null; }
export async function addInvoice(invoiceData: any): Promise<any> { return {}; }
export async function updateInvoice(id: string, updatedFields: any): Promise<any> { return {}; }
export async function deleteInvoice(id: string): Promise<any> { return false; }
export async function getPayments(): Promise<any> { return []; }
export async function addPayment(paymentData: any): Promise<any> { return {}; }
