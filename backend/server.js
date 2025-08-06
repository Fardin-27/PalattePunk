const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const protectedRoutes = require('./routes/protectedRoutes');
const adminRoutes = require('./routes/adminRoutes');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes'); // ✅ route import

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json()); // ⬅️ This is REQUIRED to read JSON body

// ✅ Mount your routes
app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes);

// ✅ Test route
app.get('/', (req, res) => {
  res.send('🎨 PalettePunk backend is running!');
});

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

//Test Protected routes
app.use('/api/user', protectedRoutes);
