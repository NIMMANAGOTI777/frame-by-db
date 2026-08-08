import mongoose, { Schema, Document } from 'mongoose';

// 1. Admin Schema
const adminSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  email: { type: String, trim: true }
}, { timestamps: true });

// 2. User Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }
}, { timestamps: true });

// 3. Client Schema
const downloadSchema = new Schema({
  label: String,
  size: String,
  url: String
}, { _id: false });

const clientSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, required: true },
  companyName: { type: String, default: '' },
  billingAddress: { type: String, default: '' },
  accessKey: { type: String, required: true, unique: true, trim: true },
  downloads: { type: [downloadSchema], default: [] },
  albumPhotos: { type: [String], default: [] }
}, { timestamps: true });

// 4. Booking Schema
const bookingSchema = new Schema({
  bookingId: { type: String, unique: true, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  date: { type: Date, required: true },
  eventType: { type: String, required: true },
  location: { type: String, required: true },
  budget: { type: Number, default: null },
  message: { type: String, default: '' },
  status: { type: String, enum: ['New', 'Confirmed', 'Shoot Completed', 'Cancelled'], default: 'New' },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'failed', 'refunded'], default: 'pending' }
}, { timestamps: true });

// 5. Invoice Schema
const invoiceItemSchema = new Schema({
  serviceName: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true }
}, { _id: false });

const historySchema = new Schema({
  action: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: String
}, { _id: false });

const invoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Sent', 'Paid', 'Cancelled'], default: 'Draft' },
  notes: String,
  history: { type: [historySchema], default: [] },
  items: { type: [invoiceItemSchema], default: [] }
}, { timestamps: true });

// 6. Setting Schema
const settingSchema = new Schema({
  businessName: { type: String, required: true },
  founderName: { type: String, required: true },
  founderImage: String,
  experienceYears: { type: Number, required: true },
  location: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  logoUrl: { type: String, required: true },
  stats: { type: Schema.Types.Mixed, default: [] },
  awards: { type: Schema.Types.Mixed, default: [] }
}, { timestamps: true });

// 7. Blog Schema
const blogSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  readTime: { type: String, default: '5 min' },
  image: { type: String, required: true },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

// 8. Portfolio Schema
const portfolioSchema = new Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

// 9. Gallery Schema
const gallerySchema = new Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true }
}, { timestamps: true });

// 10. FAQ Schema
const faqSchema = new Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' }
}, { timestamps: true });

// 11. Testimonial Schema
const testimonialSchema = new Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, default: 'Client' },
  content: { type: String, required: true },
  rating: { type: Number, default: 5 },
  image: { type: String, default: '' }
}, { timestamps: true });

// 12. Package Schema
const packageSchema = new Schema({
  name: { type: String, required: true, trim: true },
  price: { type: String, required: true },
  description: { type: String, required: true },
  features: { type: [String], default: [] }
}, { timestamps: true });

// 13. Contact Schema
const contactSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  subject: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

// 14. Payment Schema
const paymentSchema = new Schema({
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  transactionId: String,
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Success', 'Failed'], default: 'Success' }
}, { timestamps: true });

// Export Models (prevent overwrite in Next.js hot reload)
export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const ClientModel = mongoose.models.Client || mongoose.model('Client', clientSchema);
export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
export const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
export const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);
export const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);
export const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', faqSchema);
export const Testimonial = mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);
export const PackageModel = mongoose.models.Package || mongoose.model('Package', packageSchema);
export const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
export const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
