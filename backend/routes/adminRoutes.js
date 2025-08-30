// backend/routes/adminRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Feedback = require('../models/Feedback');

const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Optional Notification model
let Notification = null;
try { Notification = require('../models/Notification'); } catch (_) {}

async function notify(userId, payload) {
  if (!Notification) return;
  try { await Notification.create({ user: userId, ...payload }); }
  catch (e) { console.error('Notify error:', e.message); }
}

/** Ensure requester is Admin */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden (Admin only)' });
  }
  next();
}

/* ----------------------------------------------------------
 * Admin management (users)
 * ---------------------------------------------------------- */

router.post('/create', protect, requireAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists with this email' });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email,
      password: hashed,
      role: 'Admin',
      status: 'active',
    });

    // 🔔 notify newly created admin
    await notify(admin._id, {
      type: 'admin:created',
      title: 'Admin account created',
      body: 'Your admin account was created by another admin.',
      isRead: false,
      data: { by: req.user._id },
      actor: req.user._id
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

router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    // ⬇️ Explicitly include roleChangeRequest so the UI can see pending requests
    const users = await User.find({})
      .select('name email role status roleChangeRequest createdAt')
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (e) {
    console.error('List users error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id/ban', protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'banned' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🔔 notify banned user
    await notify(user._id, {
      type: 'user:banned',
      title: 'Account banned',
      body: 'Your account has been banned by an admin.',
      isRead: false,
      data: { by: req.user._id },
      actor: req.user._id
    });

    return res.json({ message: 'User banned', user });
  } catch (e) {
    console.error('Ban user error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id/unban', protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🔔 notify unbanned user
    await notify(user._id, {
      type: 'user:unbanned',
      title: 'Ban lifted',
      body: 'Your account ban has been lifted.',
      isRead: false,
      data: { by: req.user._id },
      actor: req.user._id
    });

    return res.json({ message: 'User unbanned', user });
  } catch (e) {
    console.error('Unban user error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id/role', protect, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Buyer', 'Artist'].includes(role)) {
      return res.status(400).json({ message: 'role must be "Buyer" or "Artist"' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, roleChangeRequest: null }, // clear any pending request on decision
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🔔 notify user of role change
    await notify(user._id, {
      type: 'user:roleChanged',
      title: 'Role updated',
      body: `Your role is now ${role}.`,
      isRead: false,
      data: { role, by: req.user._id },
      actor: req.user._id
    });

    return res.json({ message: `Role changed to ${role}`, user });
  } catch (e) {
    console.error('Change role error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id/make-admin', protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'Admin' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🔔 notify user promoted to admin
    await notify(user._id, {
      type: 'user:promotedAdmin',
      title: 'Promoted to Admin',
      body: 'You were granted Admin privileges.',
      isRead: false,
      data: { by: req.user._id },
      actor: req.user._id
    });

    return res.json({ message: 'User promoted to Admin', user });
  } catch (e) {
    console.error('Promote to admin error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------
 * Admin: Manage Artworks
 * ---------------------------------------------------------- */

router.get('/artworks', protect, requireAdmin, async (req, res) => {
  try {
    const allowed = ['published', 'hidden', 'sold'];
    const status = allowed.includes(req.query.status) ? req.query.status : undefined;
    const query = status ? { status } : {};
    const list = await Artwork.find(query)
      .populate('author', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) {
    console.error('List artworks error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/artworks/:id', protect, requireAdmin, async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id)
      .populate('author', 'name email role')
      .lean();
    if (!art) return res.status(404).json({ message: 'Artwork not found' });

    const Feedback = require('../models/Feedback');
    const feedbacks = await Feedback.find({ artwork: art._id })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ...art, feedbacks, artwork: art });
  } catch (e) {
    console.error('Read artwork (admin) error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/artworks/:id/status', protect, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['published', 'hidden', 'sold'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const art = await Artwork.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!art) return res.status(404).json({ message: 'Artwork not found' });

    // 🔔 notify author (e.g., hidden/published by admin)
    await notify(art.author, {
      type: 'art:status',
      title: 'Artwork status changed',
      body: `Status set to ${status}.`,
      isRead: false,
      data: { status, artworkId: art._id },
      actor: req.user._id
    });

    res.json({ message: 'Status updated', artwork: art });
  } catch (e) {
    console.error('Update status error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/artworks/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { title, description, tags, price } = req.body;
    const update = {};
    if (typeof title === 'string') update.title = title;
    if (typeof description === 'string') update.description = description;
    if (Array.isArray(tags)) update.tags = tags;
    if (price !== undefined) update.price = Number(price) || 0;

    const art = await Artwork.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!art) return res.status(404).json({ message: 'Artwork not found' });

    // 🔔 notify author of edit (informational)
    await notify(art.author, {
      type: 'art:edited',
      title: 'Artwork updated',
      body: 'An admin edited your artwork.',
      isRead: false,
      data: { artworkId: art._id },
      actor: req.user._id
    });

    res.json({ message: 'Artwork updated', artwork: art });
  } catch (e) {
    console.error('Update artwork error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/artworks/:id', protect, requireAdmin, async (req, res) => {
  try {
    const art = await Artwork.findByIdAndDelete(req.params.id);
    if (!art) return res.status(404).json({ message: 'Artwork not found' });

    // 🔔 notify author of deletion
    await notify(art.author, {
      type: 'art:deleted',
      title: 'Artwork deleted',
      body: `${art.title || 'Your artwork'} was removed by an admin.`,
      isRead: false,
      data: { artworkId: art._id, title: art.title },
      actor: req.user._id
    });

    res.json({ message: 'Artwork deleted' });
  } catch (e) {
    console.error('Delete artwork error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/artworks/:artId/feedbacks/:fbId', protect, requireAdmin, async (req, res) => {
  try {
    const fb = await Feedback.findOneAndDelete({
      _id: req.params.fbId,
      artwork: req.params.artId,
    });
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });

    // 🔔 notify feedback author (informational)
    await notify(fb.author, {
      type: 'feedback:removed',
      title: 'Feedback removed',
      body: 'An admin removed your feedback.',
      isRead: false,
      data: { artworkId: req.params.artId },
      actor: req.user._id
    });

    res.json({ message: 'Feedback deleted' });
  } catch (e) {
    console.error('Delete feedback error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
