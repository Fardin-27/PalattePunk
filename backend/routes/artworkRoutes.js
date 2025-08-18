// backend/routes/artworkRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Artwork = require('../models/Artwork');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

/* ---------------------------------------
   0) Ensure uploads directory exists
---------------------------------------- */
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

/* ---------------------------------------
   1) Multer storage for images
---------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `art_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

/* ---------------------------------------
   2) POST /api/artworks
   Create a new artwork (Artist/Admin only)
   Body (multipart/form-data):
     - image (file)
     - title (string, required)
     - description (string, optional)
     - tags (comma-separated string, optional)
     - price (number, optional)
---------------------------------------- */
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'Artist' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only artists can post.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }
    const { title, description = '', tags = '', price } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const tagList = tags
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const art = await Artwork.create({
      author: req.user._id,
      title: title.trim(),
      description: description.trim(),
      imageUrl: `/uploads/${req.file.filename}`,
      tags: tagList,
      status: 'published',
      ...(price !== undefined && price !== '' ? { price: Number(price) } : {})
    });

    res.status(201).json({ message: 'Artwork posted!', artwork: art });
  } catch (e) {
    console.error('POST /api/artworks error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------
   3) GET /api/artworks
   List artworks (not deleted), newest first.
   Optional query filters (used by Explore):
     - q: string (search title/description)
     - title: string (regex i)
     - description: string (regex i)
     - artist: string (filter by populated author.name, done in-memory)
     - tags: comma-separated (OR match)
     - minPrice, maxPrice: numbers
     - sort: 'recent' | 'oldest'
---------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const {
      q,
      title,
      description,
      artist,
      tags,
      minPrice,
      maxPrice,
      sort
    } = req.query;

    // Base filter: everything except deleted
    const filter = { status: { $ne: 'deleted' } };

    // Server-side regex filters (cheap fields)
    if (title) {
      filter.title = { $regex: new RegExp(title, 'i') };
    }
    if (description) {
      filter.description = { $regex: new RegExp(description, 'i') };
    }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length) {
        filter.tags = { $in: tagList }; // OR match on any tag
      }
    }
    if (minPrice !== undefined) {
      filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    }
    if (maxPrice !== undefined) {
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
    }
    if (q) {
      // Basic q: OR over title/description (server side)
      const regex = new RegExp(q, 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    // Fetch
    let items = await Artwork.find(filter)
      .populate('author', 'name role')
      .sort({ createdAt: -1 });

    // Artist name filter (requires populated author; do in-memory)
    if (artist) {
      const a = artist.toString().toLowerCase();
      items = items.filter(it =>
        (it.author?.name || '').toLowerCase().includes(a)
      );
    }

    // Sort switch
    if (sort === 'oldest') {
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(items);
  } catch (e) {
    console.error('GET /api/artworks error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------
   4) GET /api/artworks/:id
   Return one artwork (with author + comments.user populated)
---------------------------------------- */
router.get('/:id', async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id)
      .populate('author', 'name role')
      .populate('comments.user', 'name role');

    if (!art || art.status === 'deleted') {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    res.json(art);
  } catch (e) {
    console.error('GET /api/artworks/:id error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------
   5) POST /api/artworks/:id/feedback
   Add a feedback comment (logged-in users)
   Body: { text: string }
---------------------------------------- */
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Feedback text is required' });
    }

    const art = await Artwork.findById(req.params.id);
    if (!art || art.status === 'deleted') {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    art.comments.push({ user: req.user._id, text: text.trim() });
    await art.save();

    // return populated comments
    const populated = await art.populate('comments.user', 'name role');
    res.status(201).json({ message: 'Feedback added', artwork: populated });
  } catch (e) {
    console.error('POST /api/artworks/:id/feedback error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
