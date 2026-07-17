import fs from 'fs';
import path from 'path';

// Define DB path
const dbPath = path.join(process.cwd(), 'database', 'db.json');

// Interface definition for DB structure
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
        gallery: []
      };
    }
    const data = await fs.promises.readFile(dbPath, 'utf8');
    return JSON.parse(data);
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
