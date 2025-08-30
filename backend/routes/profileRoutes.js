// backend/routes/profileRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');
const Artwork = require('../models/Artwork');

const router = express.Router();

/* GET /api/profile/me */
router.get('/me', protect, async (req, res) => {
  try {
    const u = await User.findById(req.user._id).select('-password').lean();
    if (!u) return res.status(404).json({ message: 'User not found' });
    res.json(u);
  } catch (e) {
    console.error('GET /profile/me error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* PATCH /api/profile/me (bio) */
router.patch('/me', protect, async (req, res) => {
  try {
    const { bio } = req.body;
    const u = await User.findByIdAndUpdate(
      req.user._id,
      { bio: typeof bio === 'string' ? bio : '' },
      { new: true }
    ).select('-password');
    res.json(u);
  } catch (e) {
    console.error('PATCH /profile/me error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* GET /api/profile/my-artworks (author=me) */
router.get('/my-artworks', protect, async (req, res) => {
  try {
    const items = await Artwork.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (e) {
    console.error('GET /profile/my-artworks error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* GET /api/profile/purchases (buyer=me OR in User.purchases) */
router.get('/purchases', protect, async (req, res) => {
  try {
    // primary: artworks with buyer = me
    let items = await Artwork.find({ buyer: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // fallback: use user.purchases ids if any (for older buys if any)
    if (!items.length) {
      const me = await User.findById(req.user._id).select('purchases').lean();
      if (me && Array.isArray(me.purchases) && me.purchases.length) {
        const ids = me.purchases
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        if (ids.length) {
          items = await Artwork.find({ _id: { $in: ids } })
            .sort({ createdAt: -1 })
            .lean();
        }
      }
    }

    res.json(items);
  } catch (e) {
    console.error('GET /profile/purchases error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
