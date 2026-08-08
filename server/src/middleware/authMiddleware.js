const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    } else {
      // Look in cookies if header not present
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split(';').map(c => c.trim().split('='))
        );
        token = cookies['admin_token'] || cookies['client_token'];
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Access token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid access token' });
  }
}

function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin privilege required' });
    }
  });
}

function verifyClient(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user && (req.user.role === 'client' || req.user.role === 'admin')) {
      next();
    } else {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
    }
  });
}

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyClient
};
