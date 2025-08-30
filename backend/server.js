// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const profileRoutes = require('./routes/profileRoutes');
const roleRoutes = require('./routes/roleRoutes');
const marketRoutes = require('./routes/marketRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Optional
let roleAdminRoutes = null;
try { roleAdminRoutes = require('./routes/roleAdminRoutes'); } catch (_) {}

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', protectedRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingsRoutes);

if (roleAdminRoutes) app.use('/api/roles', roleAdminRoutes);

app.get('/api/artworks/health', (req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.send('🎨 PalettePunk backend is running!'));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌ Missing MONGO_URI in .env'); process.exit(1); }

// Create HTTP server + attach Socket.IO
const server = http.createServer(app);
let io = null;

const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const User = require('./models/User');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    io = require('socket.io')(server, {
      cors: { origin: 'http://localhost:3000', credentials: true }
    });

    // make io available to routes
    app.set('io', io);

    // socket auth with the same JWT secret you use in HTTP auth
    io.use(async (socket, next) => {
      try {
        const raw = socket.handshake.auth?.token
          || socket.handshake.headers?.authorization
          || socket.handshake.query?.token;
        const token = raw?.startsWith('Bearer ') ? raw.split(' ')[1] : raw;
        if (!token) return next(new Error('No token'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('_id name role status');
        if (!user) return next(new Error('User not found'));
        if (user.status === 'banned') return next(new Error('Banned'));

        socket.user = { id: String(user._id), name: user.name };
        socket.join(`user:${socket.user.id}`);
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });

    io.on('connection', (socket) => {
      // realtime send (optional: you can still send via REST)
      socket.on('msg:send', async (payload, cb) => {
        try {
          const { conversationId, text } = payload || {};
          if (!conversationId || !text?.trim()) {
            return cb && cb({ ok: false, error: 'Invalid payload' });
          }
          const convo = await Conversation.findById(conversationId);
          if (!convo || !convo.participants.some(p => String(p) === socket.user.id)) {
            return cb && cb({ ok: false, error: 'Conversation not found' });
          }
          const msg = await Message.create({
            conversation: conversationId,
            sender: socket.user.id,
            text: text.trim(),
          });
          convo.lastMessageAt = new Date();
          await convo.save();

          const populated = await msg.populate('sender', 'name');

          const rooms = convo.participants.map(id => `user:${String(id)}`);
          io.to(rooms).emit('msg:new', populated);

          cb && cb({ ok: true, data: populated });
        } catch (e) {
          console.error('msg:send error', e);
          cb && cb({ ok: false, error: 'Server error' });
        }
      });
    });

    server.listen(PORT, () => console.log(`🚀 Server (HTTP + Socket.IO) running on ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// 404 + error handlers
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});
