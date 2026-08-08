const Setting = require('../models/Setting');
const Portfolio = require('../models/Portfolio');
const Gallery = require('../models/Gallery');
const Blog = require('../models/Blog');
const FAQ = require('../models/FAQ');
const Testimonial = require('../models/Testimonial');
const Contact = require('../models/Contact');
const Booking = require('../models/Booking');
const Client = require('../models/Client');
const generateBookingId = require('../utils/generateBookingId');
const sendEmail = require('../utils/sendEmail');

// Settings
async function getSettings(req, res) {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      // Default fallback
      settings = new Setting({
        businessName: 'Frame by DB',
        founderName: 'Dasari Bharadwaj',
        founderImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
        experienceYears: 16,
        location: 'Hyderabad, India',
        phone: '+91 99999 99999',
        email: 'contact@framebydb.com',
        logoUrl: '/images/logo.png',
        stats: [
          { label: 'Years Experience', value: '16+' },
          { label: 'Films & Campaigns', value: '500+' },
          { label: 'Weddings Documented', value: '250+' },
          { label: 'Creative Excellence', value: '100%' }
        ],
        awards: []
      });
      await settings.save();
    }
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function updateSettings(req, res) {
  try {
    const updates = req.body;
    let settings = await Setting.findOne();
    if (settings) {
      Object.assign(settings, updates);
      await settings.save();
    } else {
      settings = new Setting(updates);
      await settings.save();
    }
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Portfolio
async function getPortfolio(req, res) {
  try {
    const portfolio = await Portfolio.find().sort({ createdAt: -1 });
    const mapped = portfolio.map(item => ({
      ...item.toObject(),
      id: item._id.toString()
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createPortfolio(req, res) {
  try {
    const item = new Portfolio(req.body);
    const saved = await item.save();
    return res.status(201).json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function deletePortfolio(req, res) {
  try {
    const item = await Portfolio.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Portfolio item not found' });
    }
    return res.json({ success: true, message: 'Portfolio item deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Gallery
async function getGallery(req, res) {
  try {
    const gallery = await Gallery.find().sort({ createdAt: -1 });
    const mapped = gallery.map(item => ({
      ...item.toObject(),
      id: item._id.toString()
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createGallery(req, res) {
  try {
    const item = new Gallery(req.body);
    const saved = await item.save();
    return res.status(201).json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteGallery(req, res) {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Gallery item not found' });
    }
    return res.json({ success: true, message: 'Gallery item deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Blogs
async function getBlogs(req, res) {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    const mapped = blogs.map(item => ({
      ...item.toObject(),
      id: item._id.toString()
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getBlogBySlug(req, res) {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    return res.json({
      ...blog.toObject(),
      id: blog._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createBlog(req, res) {
  try {
    const blog = new Blog(req.body);
    const saved = await blog.save();
    return res.status(201).json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteBlog(req, res) {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }
    return res.json({ success: true, message: 'Blog post deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// FAQs
async function getFAQs(req, res) {
  try {
    const faqs = await FAQ.find().sort({ category: 1, createdAt: -1 });
    const mapped = faqs.map(item => ({
      ...item.toObject(),
      id: item._id.toString()
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createFAQ(req, res) {
  try {
    const faq = new FAQ(req.body);
    const saved = await faq.save();
    return res.status(201).json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteFAQ(req, res) {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, error: 'FAQ not found' });
    }
    return res.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Testimonials
async function getTestimonials(req, res) {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    const mapped = testimonials.map(item => ({
      ...item.toObject(),
      id: item._id.toString()
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createTestimonial(req, res) {
  try {
    const test = new Testimonial(req.body);
    const saved = await test.save();
    return res.status(201).json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteTestimonial(req, res) {
  try {
    const test = await Testimonial.findByIdAndDelete(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Testimonial not found' });
    }
    return res.json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Website Contact Form Submission
async function submitContactForm(req, res) {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // 1. Save Contact submission log
    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    // 2. Also save as Booking (General Inquiry event type) so it shows up in Admin dashboard inquiries
    let client = await Client.findOne({ email: email.trim().toLowerCase() });
    if (!client) {
      client = new Client({
        name,
        email: email.trim().toLowerCase(),
        phone,
        accessKey: `KEY-${Math.floor(1000 + Math.random() * 9000)}`,
        companyName: '',
        billingAddress: 'Website Contact Form',
        downloads: [],
        albumPhotos: []
      });
      await client.save();
    }

    const bookingId = await generateBookingId();
    const newInquiry = new Booking({
      bookingId,
      clientId: client._id,
      name,
      phone,
      email: email.trim().toLowerCase(),
      date: new Date(),
      eventType: 'General Inquiry',
      location: 'Website Contact Form',
      budget: null,
      message: message,
      status: 'New',
      paymentStatus: 'pending'
    });

    const savedInquiry = await newInquiry.save();

    // Emit Socket.IO Notification
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new-booking', {
        ...savedInquiry.toObject(),
        id: savedInquiry._id.toString(),
        clientId: client._id.toString()
      });
    }

    // 3. Dispatch emails
    const adminEmail = process.env.ADMIN_EMAIL;
    const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const founderText = `New Contact Inquiry\n\nName:\n${name}\n\nEmail:\n${email}\n\nPhone:\n${phone}\n\nMessage:\n${message}\n\nSubmitted At:\n${formattedDate}\n\nWebsite:\nFrame by DB`;
    const customerText = `Hi ${name},\n\nThank you for contacting Frame by DB.\n\nWe have received your inquiry and our team will review it shortly.\n\nWe usually respond within 24 hours.\n\nRegards,\n\nDasari Bharadwaj\nFrame by DB\nHyderabad`;

    try {
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: '📩 New Contact Inquiry | Frame by DB',
          text: founderText
        });
      }
      await sendEmail({
        to: email,
        subject: 'Thank you for contacting Frame by DB',
        text: customerText
      });
    } catch (emailErr) {
      console.error('Email dispatch error on contact submission:', emailErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: {
        ...savedInquiry.toObject(),
        id: savedInquiry._id.toString()
      }
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Packages
async function getPackages(req, res) {
  try {
    const packages = await Package.find().sort({ createdAt: 1 });
    const mapped = packages.map(pkg => ({
      ...pkg.toObject(),
      id: pkg._id.toString()
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createPackage(req, res) {
  try {
    const pkg = new Package(req.body);
    const saved = await pkg.save();
    return res.status(201).json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function deletePackage(req, res) {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }
    return res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getPortfolio,
  createPortfolio,
  deletePortfolio,
  getGallery,
  createGallery,
  deleteGallery,
  getBlogs,
  getBlogBySlug,
  createBlog,
  deleteBlog,
  getFAQs,
  createFAQ,
  deleteFAQ,
  getTestimonials,
  createTestimonial,
  deleteTestimonial,
  submitContactForm,
  getPackages,
  createPackage,
  deletePackage
};
