const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  
  email: {
    type: String,
    required: true,
    unique: true
  },
  
  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['Admin', 'Artist', 'Buyer'],
    default: 'Buyer'
  },

  status: {
    type: String,
    enum: ['active', 'banned'],
    default: 'active'
  },

  roleChangeRequest: {
    type: String, // 'Artist', 'Buyer', or null
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
