// backend/routes/feedbackRoutes.js
const express = require('express');
const Feedback = require('../models/Feedback');
const Artwork = require('../models/Artwork');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/feedbacks/:artworkId
 * Public: list visible feedbacks (hidden=false)
 */
router.get('/:artworkId', async (req, res) => {
  const { artworkId } = req.params;
  const list = await Feedback.find({ artwork: artworkId, hidden: false })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json(list);
});

/**
 * POST /api/feedbacks
 * Auth required
 * body: { artworkId, content }
 */
router.post('/', protect, async (req, res) => {
  const { artworkId, content } = req.body;
  if (!artworkId || !content) {
    return res.status(400).json({ message: 'artworkId and content are required' });
  }

  const art = await Artwork.findById(artworkId);
  if (!art) return res.status(404).json({ message: 'Artwork not found' });

  const fb = await Feedback.create({
    artwork: artworkId,
    user: req.user._id,
    content,
  });

  const populated = await fb.populate('user', 'name email');
  res.status(201).json({ message: 'Feedback added', feedback: populated });
});

module.exports = router;
