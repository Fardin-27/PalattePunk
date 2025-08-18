// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware'); // default export

const router = express.Router();

/**
 * POST /api/auth/register
 * body: { name, email, password, role }  // role: "Buyer" | "Artist" (default Buyer)
 */
router.post('/register', async (req, res) => {
  try {
    let { name = '', email = '', password = '', role = 'Buyer' } = req.body;

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    role = role === 'Artist' ? 'Artist' : 'Buyer';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role,             // "Buyer" or "Artist"
      status: 'active', // default state
    });

    return res.status(201).json({
      message: 'Registration successful. Please log in.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // 🔒 Block banned accounts
    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Your account is banned.' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/auth/me
 * returns the current user (requires Authorization: Bearer <token>)
 */
router.get('/me', protect, async (req, res) => {
  // protect attaches req.user (without password)
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
    },
  });
});

module.exports = router;
