// backend/routes/artworkRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Artwork = require('../models/Artwork');
const Feedback = require('../models/Feedback'); // make sure this model exists
const protect = require('../middleware/authMiddleware');

const router = express.Router();

/* ---------------------------------------------------
   Optional Notification helper (safe if model missing)
--------------------------------------------------- */
let Notification = null;
try { Notification = require('../models/Notification'); } catch (_) {}
async function notify(userId, payload) {
  if (!Notification) return;
  try { await Notification.create({ user: userId, ...payload }); }
  catch (e) { console.error('Notify error:', e.message); }
}

/* ---------------------------------------------------
   Ensure uploads dir exists
--------------------------------------------------- */
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

/* ---------------------------------------------------
   Multer storage for image uploads
--------------------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `art_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

/* ---------------------------------------------------
   POST /api/artworks
   Create artwork (Artist/Admin only)
   multipart/form-data: image, title, description, tags, price
--------------------------------------------------- */
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'Artist' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only artists can post.' });
    }
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const {
      title,
      description = '',
      tags = '',
      price = 0
    } = req.body;

    const art = await Artwork.create({
      author: req.user._id,
      title,
      description,
      imageUrl: `/uploads/${req.file.filename}`,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      price: Number(price) || 0,
      status: 'published'
    });

    // 🔔 notify author about successful post (include title/body for your UI)
    await notify(req.user._id, {
      type: 'art:posted',
      title: 'Artwork posted',
      body: `${art.title || 'Your artwork'} is now live.`,
      isRead: false,
      data: { artworkId: art._id, title: art.title },
      actor: req.user._id
    });

    res.status(201).json({ message: 'Artwork posted!', artwork: art });
  } catch (e) {
    console.error('POST /api/artworks error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------
   GET /api/artworks
   Public feed: only published (and not hidden/sold)
--------------------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const items = await Artwork.find({ status: 'published' })
      .populate('author', 'name role')
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (e) {
    console.error('GET /api/artworks error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------
   GET /api/artworks/:id
   Read one artwork + feedbacks
   Returns a single object with artwork fields PLUS "feedbacks" array
--------------------------------------------------- */
router.get('/:id', async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id)
      .populate('author', 'name role')
      .lean();
    if (!art) return res.status(404).json({ message: 'Artwork not found' });

    const feedbacks = await Feedback.find({ artwork: art._id })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Merge feedbacks into the response (keeps your existing frontend shape simple)
    res.json({ ...art, feedbacks });
  } catch (e) {
    console.error('GET /api/artworks/:id error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------
   POST /api/artworks/:id/feedback
   Add feedback (any logged-in user)
--------------------------------------------------- */
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Feedback text is required' });
    }

    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ message: 'Artwork not found' });

    const fb = await Feedback.create({
      artwork: art._id,
      author: req.user._id,
      text: text.trim()
    });

    // 🔔 notify artwork author (avoid notifying yourself)
    if (String(art.author) !== String(req.user._id)) {
      await notify(art.author, {
        type: 'feedback:new',
        title: 'New feedback',
        body: 'Someone commented on your artwork.',
        isRead: false,
        data: { artworkId: art._id, feedbackId: fb._id },
        actor: req.user._id
      });
    }

    const populated = await Feedback.findById(fb._id)
      .populate('author', 'name')
      .lean();

    res.status(201).json({ message: 'Feedback added', feedback: populated });
  } catch (e) {
    console.error('POST /api/artworks/:id/feedback error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
