// backend/routes/roleRoutes.js
const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

/* Optional Notification helper (safe if model missing) */
let Notification = null;
try { Notification = require('../models/Notification'); } catch (_) {}
async function notify(userId, payload) {
  if (!Notification) return;
  try { await Notification.create({ user: userId, ...payload }); }
  catch (e) { console.error('Notify error:', e.message); }
}

/**
 * POST /api/roles/request
 * body: { requestedRole?: "Artist"|"Buyer", targetRole?: "Artist"|"Buyer", reason?: string }
 */
router.post('/request', protect, async (req, res) => {
  try {
    const { requestedRole, targetRole, reason = '' } = req.body;

    // accept either key from the client
    const desired = (targetRole || requestedRole || '').trim();

    const ALLOWED = ['Artist', 'Buyer']; // Admin changes stay admin-only
    if (!ALLOWED.includes(desired)) {
      return res.status(400).json({ message: 'Invalid target role' });
    }

    // persist request on the user doc (simple queue-free approach)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        roleChangeRequest: {
          requestedRole: desired,
          reason: String(reason || '').slice(0, 1000),
          requestedAt: new Date(),
          status: 'pending',
        },
      },
      { new: true }
    ).select('-password');

    // 🔔 confirmation notification to requester (add title/body for your UI)
    await notify(req.user._id, {
      type: 'role:requested',
      title: 'Role request submitted',
      body: `You requested the ${desired} role.`,
      isRead: false,
      data: { requestedRole: desired },
      actor: req.user._id
    });

    // 🔔 NEW: notify all active admins about the incoming request
    const admins = await User.find({ role: 'Admin', status: 'active' }).select('_id name');
    await Promise.all(
      admins.map(a =>
        notify(a._id, {
          type: 'role:request_inbox',
          title: 'New role change request',
          body: `${user?.name || 'A user'} requested the ${desired} role.`,
          isRead: false,
          data: { userId: user?._id, requestedRole: desired },
          actor: req.user._id
        })
      )
    );

    return res.json({
      message: 'Role change request submitted',
      request: user.roleChangeRequest,
    });
  } catch (e) {
    console.error('role request error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/roles/my-request
 * Return your current (latest) request (optional helper the UI may call)
 */
router.get('/my-request', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('role roleChangeRequest name email');
    if (!user) return res.status(404).json({ message: 'Not found' });
    return res.json(user.roleChangeRequest || null);
  } catch (e) {
    console.error('get my-request error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
