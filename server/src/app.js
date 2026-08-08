const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const clientAuthRoutes = require('./routes/clientAuthRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const clientAdminRoutes = require('./routes/clientAdminRoutes');
const adminInvoiceRoutes = require('./routes/adminInvoiceRoutes');
const clientInvoiceRoutes = require('./routes/clientInvoiceRoutes');
const clientPaymentRoutes = require('./routes/clientPaymentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const cmsRoutes = require('./routes/cmsRoutes');

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://frame-by-db-api.onrender.com"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"]
    }
  },
  crossOriginResourcePolicy: false
}));

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'https://frame-by-db.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) and whitelist allowed origins
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static File Hosting (for serving generated Invoice PDFs)
app.use('/invoices', express.static(path.join(process.cwd(), 'public', 'invoices')));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Mount Routes
const invoiceController = require('./controllers/invoiceController');
app.get('/api/invoices/public/:invoiceNumber', invoiceController.getPublicInvoiceData);

app.use('/api/auth', authRoutes);
app.use('/api/client/auth', clientAuthRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin/clients', clientAdminRoutes);
app.use('/api/admin/invoices', adminInvoiceRoutes);
app.use('/api/client/invoices', clientInvoiceRoutes);
app.use('/api/client/payments', clientPaymentRoutes);
app.use('/api/client', clientRoutes);
app.use('/api', cmsRoutes); // Mounted at /api so subroutes are /api/settings, /api/portfolio etc.

// Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

module.exports = app;
