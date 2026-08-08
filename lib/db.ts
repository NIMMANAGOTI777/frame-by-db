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

// Convert Decimals (backward compatibility)
export function convertDecimals<T>(obj: T): any {
  return obj;
}

// Read database aggregator calling the Express REST API
export async function readDB(): Promise<DBStructure> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  try {
    const [setRes, portRes, galRes, blogRes, faqRes, pkgRes, testRes] = await Promise.all([
      fetch(`${apiBase}/settings`, { cache: 'no-store' }),
      fetch(`${apiBase}/portfolio`, { cache: 'no-store' }),
      fetch(`${apiBase}/gallery`, { cache: 'no-store' }),
      fetch(`${apiBase}/blogs`, { cache: 'no-store' }),
      fetch(`${apiBase}/faq`, { cache: 'no-store' }),
      fetch(`${apiBase}/packages`, { cache: 'no-store' }),
      fetch(`${apiBase}/testimonials`, { cache: 'no-store' })
    ]);

    const settings = setRes.ok ? await setRes.json() : {};
    const portfolio = portRes.ok ? await portRes.json() : [];
    const gallery = galRes.ok ? await galRes.json() : [];
    const blogs = blogRes.ok ? await blogRes.json() : [];
    const faqs = faqRes.ok ? await faqRes.json() : [];
    const packagesList = pkgRes.ok ? await pkgRes.json() : [];
    const testimonials = testRes.ok ? await testRes.json() : [];

    const pricing = packagesList.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      period: 'Event',
      description: p.description,
      features: p.features,
      isRecommended: p.name.toLowerCase().includes('gold')
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
    console.error('Error aggregator reading database via Express API:', error);
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

// Write database mock (backward compatibility)
export async function writeDB(data: DBStructure): Promise<void> {
  console.log('writeDB called - operations are performed via REST API to Express.');
}

// Get settings specifically (backward compatibility)
export async function getSettings() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(`${apiBase}/settings`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('getSettings fetch failed:', err);
  }
  return {};
}

// Stub exports for Next.js compiler backward compatibility
export async function getClients(): Promise<any> { return []; }
export async function getClientById(id: string): Promise<any> { return null; }
export async function addClient(clientData: any): Promise<any> { return {}; }
export async function updateClient(id: string, updatedFields: any): Promise<any> { return {}; }
export async function deleteClient(id: string): Promise<any> { return true; }

export async function getBookings(): Promise<any> { return []; }
export async function addBooking(bookingData: any): Promise<any> { return {}; }
export async function updateBooking(id: string, updatedFields: any): Promise<any> { return {}; }
export async function deleteBooking(id: string): Promise<any> { return true; }

export async function getInvoices(): Promise<any> { return []; }
export async function getInvoiceById(id: string): Promise<any> { return null; }
export async function getInvoicesByClientId(clientId: string): Promise<any> { return []; }
export async function addInvoice(invoiceData: any, itemsData: any[]): Promise<any> { return {}; }
export async function updateInvoice(id: string, updatedFields: any, itemsData?: any[]): Promise<any> { return {}; }
export async function deleteInvoice(id: string): Promise<any> { return true; }
export async function addInvoiceHistory(invoiceId: string, action: string, notes?: string): Promise<any> { return true; }

export async function getPayments(): Promise<any> { return []; }
export async function addPayment(paymentData: any): Promise<any> { return {}; }

export async function addBlog(blogData: any): Promise<any> { return {}; }
export async function updateBlog(id: string, updatedFields: any): Promise<any> { return {}; }
export async function deleteBlog(id: string): Promise<any> { return true; }

export async function addPortfolioItem(itemData: any): Promise<any> { return {}; }
export async function updatePortfolioItem(id: string, updatedFields: any): Promise<any> { return {}; }
export async function deletePortfolioItem(id: string): Promise<any> { return true; }

export async function addGalleryItem(itemData: any): Promise<any> { return {}; }
export async function deleteGalleryItem(id: string): Promise<any> { return true; }

export async function updateSettings(settingsData: any): Promise<any> { return {}; }

export async function clearAllBookings(): Promise<any> { return true; }
export async function getBlogs(): Promise<any> { return []; }
export async function getGallery(): Promise<any> { return []; }
export async function getPortfolio(): Promise<any> { return []; }
