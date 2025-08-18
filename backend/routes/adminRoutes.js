// backend/routes/adminRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware'); // default export: module.exports = function...

const router = express.Router();

/**
 * Helper: ensure requester is Admin
 */
function requireAdmin(req, res) {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403).json({ message: 'Forbidden (Admin only)' });
    return false;
  }
  return true;
}

/**
 * POST /api/admin/create
 * Create another admin (Admin only)
 * body: { name, email, password }
 */
router.post('/create', protect, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'User already exists with this email' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email,
      password: hashed,
      role: 'Admin',
      status: 'active',
    });

    return res.status(201).json({
      message: 'Admin created successfully',
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (e) {
    console.error('Create admin error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/admin/users
 * List all users (Admin only)
 */
router.get('/users', protect, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (e) {
    console.error('List users error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/ban
 * Ban/Unban a user (Admin only)
 * body: { action: "ban" | "unban" }
 */
router.patch('/users/:id/ban', protect, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { action } = req.body;
    if (!['ban', 'unban'].includes(action)) {
      return res.status(400).json({ message: 'action must be "ban" or "unban"' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: action === 'ban' ? 'banned' : 'active' },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      message: `User ${action}ned`,
      user,
    });
  } catch (e) {
    console.error('Ban/unban error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Change role between Buyer and Artist (Admin only)
 * body: { role: "Buyer" | "Artist" }
 */
router.patch('/users/:id/role', protect, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { role } = req.body;
    if (!['Buyer', 'Artist'].includes(role)) {
      return res.status(400).json({ message: 'role must be "Buyer" or "Artist"' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, roleChangeRequest: null },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      message: `Role changed to ${role}`,
      user,
    });
  } catch (e) {
    console.error('Change role error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/make-admin
 * Promote a user to Admin (Admin only)
 */
router.patch('/users/:id/make-admin', protect, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'Admin' },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      message: 'User promoted to Admin',
      user,
    });
  } catch (e) {
    console.error('Promote to admin error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
