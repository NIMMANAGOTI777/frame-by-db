require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const Setting = require('./models/Setting');
const Admin = require('./models/Admin');
const User = require('./models/User');
const Client = require('./models/Client');
const Booking = require('./models/Booking');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const FAQ = require('./models/FAQ');
const Package = require('./models/Package');
const Testimonial = require('./models/Testimonial');
const Blog = require('./models/Blog');
const Portfolio = require('./models/Portfolio');
const Gallery = require('./models/Gallery');
const Video = require('./models/Video');
const Employee = require('./models/Employee');
const Notification = require('./models/Notification');
const Contact = require('./models/Contact');
const Service = require('./models/Service');

const connectDB = require('./config/database');
const dbPath = path.join(__dirname, '..', '..', 'database', 'db.json');

async function seed() {
  const stats = {
    settings: 0,
    admins: 0,
    users: 0,
    clients: 0,
    bookings: 0,
    invoices: 0,
    faqs: 0,
    packages: 0,
    blogs: 0,
    portfolios: 0,
    galleries: 0
  };

  try {
    await connectDB();

    if (!fs.existsSync(dbPath)) {
      console.error(`db.json file not found at ${dbPath}`);
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // Clear existing collections
    console.log('Clearing existing collections...');
    await Promise.all([
      Setting.deleteMany({}),
      Admin.deleteMany({}),
      User.deleteMany({}),
      Client.deleteMany({}),
      Booking.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      FAQ.deleteMany({}),
      Package.deleteMany({}),
      Testimonial.deleteMany({}),
      Blog.deleteMany({}),
      Portfolio.deleteMany({}),
      Gallery.deleteMany({}),
      Video.deleteMany({}),
      Employee.deleteMany({}),
      Notification.deleteMany({}),
      Contact.deleteMany({}),
      Service.deleteMany({})
    ]);
    console.log('Database cleared.');

    // 1. Seed Settings
    if (data.settings) {
      console.log('Seeding Settings...');
      const settings = new Setting(data.settings);
      await settings.save();
      stats.settings++;
    }

    // 2. Seed Admins & Users
    console.log('Seeding Admins & Users...');
    if (data.admins && data.admins.length > 0) {
      for (const a of data.admins) {
        const adminObj = {
          username: a.username,
          password: a.password, // already bcrypt hashed in JSON!
          email: a.email || `${a.username}@framebydb.com`
        };
        await new Admin(adminObj).save();
        stats.admins++;
      }
    } else {
      // Create default admin
      const hashedPass = bcrypt.hashSync('password123', 10);
      await new Admin({ username: 'admin', password: hashedPass, email: 'admin@framebydb.com' }).save();
      stats.admins++;
    }

    if (data.users && data.users.length > 0) {
      for (const u of data.users) {
        const userObj = {
          username: u.username,
          password: u.password.startsWith('$2') ? u.password : bcrypt.hashSync(u.password, 10),
          role: u.role || 'admin'
        };
        await new User(userObj).save();
        stats.users++;
      }
    }

    // 3. Seed Clients (and map IDs)
    console.log('Seeding Clients...');
    const clientMap = {}; // json uuid -> Mongoose ObjectId
    if (data.clients && data.clients.length > 0) {
      for (const c of data.clients) {
        const newId = new mongoose.Types.ObjectId();
        clientMap[c.id] = newId;

        const client = new Client({
          _id: newId,
          name: c.name,
          email: c.email.trim().toLowerCase(),
          phone: c.phone,
          companyName: c.companyName || '',
          billingAddress: c.billingAddress || '',
          accessKey: c.accessKey,
          downloads: c.downloads || [],
          albumPhotos: c.albumPhotos || []
        });
        await client.save();
        stats.clients++;
      }
    }

    // 4. Seed Bookings (and map IDs)
    console.log('Seeding Bookings...');
    const bookingMap = {}; // json uuid -> Mongoose ObjectId
    if (data.bookings && data.bookings.length > 0) {
      for (const b of data.bookings) {
        const newId = new mongoose.Types.ObjectId();
        bookingMap[b.id] = newId;

        // Try mapping to client
        let matchedClient = await Client.findOne({ email: b.email.trim().toLowerCase() });
        const clientId = matchedClient ? matchedClient._id : null;

        const booking = new Booking({
          _id: newId,
          bookingId: b.bookingId || `BK-${new Date(b.createdAt || Date.now()).getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          clientId,
          name: b.name,
          phone: b.phone,
          email: b.email.trim().toLowerCase(),
          date: new Date(b.date),
          eventType: b.eventType,
          location: b.location,
          budget: typeof b.budget === 'number' ? b.budget : parseFloat(String(b.budget || '').replace(/[^0-9.]/g, '')) || null,
          message: b.message || '',
          status: b.status || 'New',
          paymentStatus: b.paymentStatus || 'pending',
          createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
          updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date()
        });
        await booking.save();
        stats.bookings++;
      }
    }

    // 5. Seed Invoices with embedded InvoiceItems
    console.log('Seeding Invoices...');
    if (data.invoices && data.invoices.length > 0) {
      for (const inv of data.invoices) {
        // Map Client and Booking IDs
        const clientId = clientMap[inv.clientId] || null;
        const bookingId = bookingMap[inv.bookingId] || null;

        if (!clientId) {
          console.warn(`Warning: Client reference not found for invoice ${inv.invoiceNumber}`);
          continue;
        }

        // Get invoice items
        const rawItems = (data.invoiceItems || []).filter(item => item.invoiceId === inv.id);
        const mappedItems = rawItems.map(item => ({
          serviceName: item.serviceName,
          description: item.description || '',
          quantity: item.quantity || 1,
          price: item.price,
          tax: item.tax || 0,
          total: item.total
        }));

        const invoice = new Invoice({
          invoiceNumber: inv.invoiceNumber,
          bookingId,
          clientId,
          issueDate: new Date(inv.issueDate),
          dueDate: new Date(inv.dueDate),
          subtotal: inv.subtotal,
          tax: inv.tax || 0,
          discount: inv.discount || 0,
          total: inv.total,
          paidAmount: inv.paidAmount || 0,
          balanceAmount: inv.balanceAmount !== undefined ? inv.balanceAmount : (inv.total - (inv.paidAmount || 0)),
          status: inv.status || 'Draft',
          notes: inv.notes || '',
          history: inv.history || [],
          items: mappedItems,
          createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
          updatedAt: inv.updatedAt ? new Date(inv.updatedAt) : new Date()
        });

        await invoice.save();
        stats.invoices++;
      }
    }

    // 6. Seed FAQs
    console.log('Seeding FAQs...');
    if (data.faqs && data.faqs.length > 0) {
      for (const f of data.faqs) {
        await new FAQ({
          question: f.question,
          answer: f.answer,
          category: f.category
        }).save();
        stats.faqs++;
      }
    }

    // 7. Seed Pricing Packages
    console.log('Seeding Packages...');
    if (data.pricing && data.pricing.length > 0) {
      for (const p of data.pricing) {
        await new Package({
          name: p.name,
          price: p.price,
          features: p.features,
          description: p.description || ''
        }).save();
        stats.packages++;
      }
    }

    // 8. Seed Blogs, Portfolio, Gallery
    console.log('Seeding Blogs, Portfolio, Gallery...');
    if (data.blogs && data.blogs.length > 0) {
      for (const b of data.blogs) {
        await new Blog(b).save();
        stats.blogs++;
      }
    }
    if (data.portfolio && data.portfolio.length > 0) {
      for (const p of data.portfolio) {
        await new Portfolio({
          ...p,
          date: new Date(p.date)
        }).save();
        stats.portfolios++;
      }
    }
    if (data.gallery && data.gallery.length > 0) {
      for (const g of data.gallery) {
        await new Gallery(g).save();
        stats.galleries++;
      }
    }

    console.log('Seeding completed successfully!');
    console.log('====================================');
    console.log('SUMMARY OF SEED INSERTION COUNTS:');
    console.log(`- Settings: ${stats.settings}`);
    console.log(`- Admins: ${stats.admins}`);
    console.log(`- Users: ${stats.users}`);
    console.log(`- Clients: ${stats.clients}`);
    console.log(`- Bookings: ${stats.bookings}`);
    console.log(`- Invoices: ${stats.invoices}`);
    console.log(`- FAQs: ${stats.faqs}`);
    console.log(`- Packages: ${stats.packages}`);
    console.log(`- Blogs: ${stats.blogs}`);
    console.log(`- Portfolios: ${stats.portfolios}`);
    console.log(`- Galleries: ${stats.galleries}`);
    console.log('====================================');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failure:', error);
    mongoose.connection && mongoose.connection.close();
    process.exit(1);
  }
}

seed();
