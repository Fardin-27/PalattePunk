// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const artworkRoutes = require('./routes/artworkRoutes');

const app = express();

/* -----------------------------
   1) Global middleware
--------------------------------*/
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -----------------------------
   2) Static files for uploads
--------------------------------*/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* -----------------------------
   3) API routes
--------------------------------*/
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', protectedRoutes);
app.use('/api/artworks', artworkRoutes);

// Optional: quick health check to confirm artworks router is mounted
app.get('/api/artworks/health', (req, res) => {
  res.json({ ok: true });
});

/* -----------------------------
   4) Root health check
--------------------------------*/
app.get('/', (req, res) => {
  res.send('🎨 PalettePunk backend is running!');
});

/* -----------------------------
   5) Start server AFTER DB
--------------------------------*/
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI in .env');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

/* -----------------------------
   6) 404 handler (after all routes)
--------------------------------*/
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

/* -----------------------------
   7) Error handler
--------------------------------*/
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});

module.exports = app; // optional: handy for tests
