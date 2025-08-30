// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authorized' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Token invalid or expired' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // 🚫 Block non-active users on every protected request
    if (user.status !== 'active') {
      return res.status(403).json({
        message: user.status === 'banned' ? 'Your account is banned.' : 'Your account is deleted.'
      });
    }

    req.user = user;
    next();
  } catch (e) {
    console.error('authMiddleware error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
