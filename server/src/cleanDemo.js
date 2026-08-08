require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('./config/database');
const Booking = require('./models/Booking');
const Client = require('./models/Client');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');
const Contact = require('./models/Contact');

async function cleanDemoData() {
  try {
    await connectDB();
    console.log('Cleaning demo bookings, clients, invoices, payments, notifications, and contacts from MongoDB Atlas...');

    const [bRes, cRes, iRes, pRes, nRes, conRes] = await Promise.all([
      Booking.deleteMany({}),
      Client.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
      Contact.deleteMany({})
    ]);

    console.log(`Deleted ${bRes.deletedCount} demo bookings.`);
    console.log(`Deleted ${cRes.deletedCount} demo clients.`);
    console.log(`Deleted ${iRes.deletedCount} demo invoices.`);
    console.log(`Deleted ${pRes.deletedCount} demo payments.`);
    console.log(`Deleted ${nRes.deletedCount} demo notifications.`);
    console.log(`Deleted ${conRes.deletedCount} demo contacts.`);

    console.log('Demo cleanup completed successfully! MongoDB Atlas is clean and ready for live bookings.');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning demo data:', error);
    process.exit(1);
  }
}

cleanDemoData();
