const Admin = require('../models/Admin');
const User = require('../models/User');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';

// Admin Login
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    // Look up in Admin table first
    let account = await Admin.findOne({ username });
    
    // Look up in User table next
    if (!account) {
      account = await User.findOne({ username });
    }

    if (!account) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({
      id: account._id,
      username: account.username,
      role: 'admin'
    }, JWT_SECRET, { expiresIn: '1d' });

    // Set cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.json({
      success: true,
      user: { username: account.username, role: 'admin' },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Admin Me (verify session)
async function adminMe(req, res) {
  return res.json({ isLoggedIn: true, user: req.user });
}

// Admin Logout
async function adminLogout(req, res) {
  res.clearCookie('admin_token');
  return res.json({ success: true });
}

// Client Login (via accessKey)
async function clientLogin(req, res) {
  try {
    const { accessKey } = req.body;
    if (!accessKey) {
      return res.status(400).json({ success: false, error: 'Access key is required' });
    }

    const client = await Client.findOne({ accessKey });
    if (!client) {
      return res.status(401).json({ success: false, error: 'Invalid access key' });
    }

    const token = jwt.sign({
      id: client._id,
      name: client.name,
      email: client.email,
      role: 'client'
    }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('client_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      success: true,
      client: { id: client._id, name: client.name, email: client.email },
      token
    });
  } catch (error) {
    console.error('Client login error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Client Check Auth
async function clientCheckAuth(req, res) {
  try {
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.json({ isLoggedIn: false });
    }
    return res.json({
      isLoggedIn: true,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        companyName: client.companyName,
        billingAddress: client.billingAddress
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Client Logout
async function clientLogout(req, res) {
  res.clearCookie('client_token');
  return res.json({ success: true });
}

module.exports = {
  adminLogin,
  adminMe,
  adminLogout,
  clientLogin,
  clientCheckAuth,
  clientLogout
};
