// backend/routes/notificationRoutes.js
const express = require('express');
const protect = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

const router = express.Router();

/**
 * POST /api/notifications
 * Create one (handy for quick tests or admin tools)
 * body: { title, body, type, meta }
 */
router.post('/', protect, async (req, res) => {
  try {
    const { title = '', body = '', type = 'info', meta = {} } = req.body || {};
    if (!title.trim()) return res.status(400).json({ message: 'title is required' });
    const doc = await Notification.create({
      user: req.user._id,
      title: String(title).trim(),
      body: String(body),
      type: String(type),
      meta: meta || {},
    });
    res.status(201).json(doc);
  } catch (e) {
    console.error('POST /notifications error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/notifications
 * Optional pagination: ?page=1&limit=20
 * Default: page=1, limit=50
 */
router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ user: req.user._id }),
    ]);

    res.json({ items, page, limit, total });
  } catch (e) {
    console.error('GET /notifications error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', protect, async (req, res) => {
  try {
    const c = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ unread: c });
  } catch (e) {
    console.error('GET /notifications/unread-count error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark one as read
 */
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const doc = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('PATCH /notifications/:id/read error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all my notifications as read
 */
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ ok: true });
  } catch (e) {
    console.error('PATCH /notifications/read-all error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
