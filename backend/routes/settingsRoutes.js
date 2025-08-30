// backend/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();

const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

// PUT /api/settings/email
router.put('/email', protect, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Invalid' });

    // ensure unique email (not used by someone else)
    const exists = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (exists) return res.status(409).json({ message: 'Invalid' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Invalid' });

    user.email = email;
    await user.save();

    return res.json({ message: 'Email Changed' });
  } catch (e) {
    console.error('settings/email error:', e);
    return res.status(500).json({ message: 'Invalid' });
  }
});

// PUT /api/settings/password
router.put('/password', protect, async (req, res) => {
  try {
    const { oldPassword = '', newPassword = '' } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Invalid' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Invalid' });

    const ok = await user.matchPassword(oldPassword);
    if (!ok) return res.status(400).json({ message: 'Invalid' });

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    return res.json({ message: 'Password Changed' });
  } catch (e) {
    console.error('settings/password error:', e);
    return res.status(500).json({ message: 'Invalid' });
  }
});

// DELETE /api/settings/delete
router.delete('/delete', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Invalid' });

    user.status = 'deleted'; // soft delete
    await user.save();

    return res.json({ message: 'Account Deleted' });
  } catch (e) {
    console.error('settings/delete error:', e);
    return res.status(500).json({ message: 'Invalid' });
  }
});

module.exports = router;
