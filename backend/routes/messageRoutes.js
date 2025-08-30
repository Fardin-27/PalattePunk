// backend/routes/messageRoutes.js
const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const router = express.Router();

// GET conversations for current user
router.get('/conversations', protect, async (req, res) => {
  const convos = await Conversation.find({ participants: req.user._id })
    .sort({ lastMessageAt: -1 })
    .limit(50)
    .populate('participants', 'name email role');
  res.json(convos);
});

/** 🔎 Search users to start a DM (name or email, case-insensitive) */
router.get('/search-users', protect, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape + i
    const users = await User.find({
      status: { $ne: 'banned' },
      $or: [{ name: rx }, { email: rx }],
    })
      .select('_id name email')
      .limit(10)
      .lean();
    res.json(users);
  } catch (e) {
    console.error('search-users error', e);
    res.status(500).json([]);
  }
});

// POST start/find a DM conversation with another user
router.post('/conversations', protect, async (req, res) => {
  const { userId } = req.body;
  if (!userId || userId === String(req.user._id)) {
    return res.status(400).json({ message: 'Invalid userId' });
  }
  let convo = await Conversation.findOne({
    participants: { $all: [req.user._id, userId], $size: 2 }
  });
  if (!convo) {
    convo = await Conversation.create({ participants: [req.user._id, userId] });
  }
  res.json(convo);
});

// GET messages in a conversation (supports ?since=ISO)
router.get('/conversations/:id/messages', protect, async (req, res) => {
  const { id } = req.params;
  const since = req.query.since ? new Date(req.query.since) : null;

  const convo = await Conversation.findById(id);
  if (!convo || !convo.participants.some(p => String(p) === String(req.user._id))) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const query = { conversation: id };
  if (since) query.createdAt = { $gt: since };

  const msgs = await Message.find(query)
    .sort({ createdAt: 1 })
    .limit(200)
    .populate('sender', 'name');

  res.json(msgs);
});

// POST send a message
router.post('/conversations/:id/messages', protect, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ message: 'Empty message' });

  const convo = await Conversation.findById(id);
  if (!convo || !convo.participants.some(p => String(p) === String(req.user._id))) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const msg = await Message.create({
    conversation: id,
    sender: req.user._id,
    text: text.trim(),
  });

  convo.lastMessageAt = new Date();
  await convo.save();

  const populated = await msg.populate('sender', 'name');

  // 🔔 NEW: broadcast to both participants if Socket.IO is running
  const io = req.app.get('io');
  if (io) {
    const rooms = convo.participants.map(pid => `user:${String(pid)}`);
    io.to(rooms).emit('msg:new', populated);
  }

  res.status(201).json(populated);
});

module.exports = router;
