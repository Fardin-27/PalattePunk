// backend/routes/roleAdminRoutes.js
const express = require('express');
const protect = require('../middleware/authMiddleware');
const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');

const router = express.Router();

// Try to load Notification model (optional, won't break if missing)
let Notification = null;
try { Notification = require('../models/Notification'); } catch (_) {}

async function notify(userId, payload) {
  if (!Notification) return;
  try { await Notification.create({ user: userId, ...payload }); }
  catch (e) { console.error('Notify error:', e.message); }
}

// middleware: require admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

/**
 * GET /api/roles/requests?status=pending|approved|rejected (default pending)
 * Admin list
 */
router.get('/requests', protect, requireAdmin, async (req, res) => {
  try {
    const status = ['pending', 'approved', 'rejected'].includes(req.query.status)
      ? req.query.status
      : 'pending';
    const list = await RoleRequest.find({ status })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    console.error('GET /roles/requests error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/roles/requests/:id/approve
 */
router.patch('/requests/:id/approve', protect, requireAdmin, async (req, res) => {
  try {
    const { adminNote = '' } = req.body;
    const rr = await RoleRequest.findById(req.params.id);
    if (!rr) return res.status(404).json({ message: 'Request not found' });
    if (rr.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    const user = await User.findById(rr.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = rr.requestedRole;
    await user.save();

    rr.status = 'approved';
    rr.adminNote = adminNote;
    await rr.save();

    // 🔔 notify the requester (add title/body)
    await notify(user._id, {
      type: 'role:approved',
      title: 'Role approved',
      body: `Your role was changed to ${rr.requestedRole}.`,
      isRead: false,
      data: { requestedRole: rr.requestedRole, adminNote },
      actor: req.user._id
    });

    res.json({ message: 'Request approved and role updated', request: rr });
  } catch (e) {
    console.error('PATCH approve error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/roles/requests/:id/reject
 */
router.patch('/requests/:id/reject', protect, requireAdmin, async (req, res) => {
  try {
    const { adminNote = '' } = req.body;
    const rr = await RoleRequest.findById(req.params.id).populate('user', 'name email');
    if (!rr) return res.status(404).json({ message: 'Request not found' });
    if (rr.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    rr.status = 'rejected';
    rr.adminNote = adminNote;
    await rr.save();

    // 🔔 notify the requester (add title/body)
    await notify(rr.user._id, {
      type: 'role:rejected',
      title: 'Role request rejected',
      body: adminNote ? `Reason: ${adminNote}` : 'Your request was rejected.',
      isRead: false,
      data: { requestedRole: rr.requestedRole, adminNote },
      actor: req.user._id
    });

    res.json({ message: 'Request rejected', request: rr });
  } catch (e) {
    console.error('PATCH reject error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
