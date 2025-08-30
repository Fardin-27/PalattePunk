// backend/routes/marketRoutes.js
const express = require('express');
const protect = require('../middleware/authMiddleware');
const Artwork = require('../models/Artwork');
const User = require('../models/User');

const router = express.Router();

// Optional Notification model
let Notification = null;
try {
  Notification = require('../models/Notification');
} catch (_) {}

async function notify(userId, payload) {
  if (!Notification) return;
  try {
    await Notification.create({ user: userId, ...payload });
  } catch (e) {
    console.error('Notify error:', e.message);
  }
}

/* GET /api/market  → only for-sale, not sold/hidden */
router.get('/', async (req, res) => {
  try {
    const items = await Artwork.find({
      price: { $gt: 0 },
      status: { $in: ['published'] },
      buyer: null
    })
      .populate('author', 'name role email')
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (e) {
    console.error('GET /market error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* GET /api/market/:id → for marketplace details (same shape as /artworks/:id) */
router.get('/:id', async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id)
      .populate('author', 'name role email')
      .lean();
    if (!art) return res.status(404).json({ message: 'Artwork not found' });

    res.json({ ...art, artwork: art });
  } catch (e) {
    console.error('GET /market/:id error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* POST /api/market/:id/buy → mark sold + record on user */
router.post('/:id/buy', protect, async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id).populate('author', '_id name');
    if (!art) return res.status(404).json({ message: 'Artwork not found' });

    if (art.status === 'sold' || art.buyer) {
      return res.status(400).json({ message: 'Already sold' });
    }
    if (!(typeof art.price === 'number') || art.price <= 0) {
      return res.status(400).json({ message: 'Artwork is not for sale' });
    }

    // mark as sold to this user
    art.status = 'sold';
    art.buyer = req.user._id;
    await art.save();

    // also track on user (helps your /profile/purchases)
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { purchases: art._id } }
    );

    // 🔔 notify seller (now with title/body so it renders)
    await notify(art.author._id, {
      type: 'market:sold',
      title: 'Your artwork was sold',
      body: `${art.title || 'Artwork'} was purchased.`,
      isRead: false,
      data: {
        artworkId: art._id,
        title: art.title || 'Artwork',
        buyerId: req.user._id,
      },
      actor: req.user._id,
    });

    // 🔔 notify buyer (already you, but include title/body for consistency)
    await notify(req.user._id, {
      type: 'market:purchase',
      title: 'Purchase confirmed',
      body: `You purchased ${art.title || 'an artwork'}.`,
      isRead: false,
      data: {
        artworkId: art._id,
        title: art.title || 'Artwork',
        sellerId: art.author._id,
      },
      actor: req.user._id,
    });

    res.json({ message: 'Purchase successful', artwork: art });
  } catch (e) {
    console.error('POST /market/:id/buy error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
