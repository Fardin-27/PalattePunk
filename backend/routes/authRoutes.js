// backend/routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

// optional notifier (safe if missing)
let notify = null;
try { ({ notify } = require('../utils/notifier')); } catch (_) {}

const router = express.Router();

/** POST /api/auth/register */
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
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    // DO NOT hash here — User pre('save') hook handles hashing
    const user = await User.create({ name, email, password, role, status: 'active' });

    try { notify && notify(user._id, 'Welcome', 'Your account is ready.', 'info'); } catch {}

    return res.status(201).json({
      message: 'Registration successful. Please log in.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // 🚫 Block anything not active (deleted/banned) BEFORE comparing password
    if (user.status !== 'active') {
      return res.status(403).json({
        message: user.status === 'banned' ? 'Your account is banned.' : 'Your account is deleted.'
      });
    }

    const ok = await user.matchPassword(password); // bcrypt.compare in model
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    try { notify && notify(user._id, 'New login', 'You signed in successfully.', 'info'); } catch {}

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/** GET /api/auth/me */
router.get('/me', protect, async (req, res) => {
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
