// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Buyer', 'Artist', 'Admin'], default: 'Buyer' },
    status: { type: String, enum: ['active', 'banned', 'deleted'], default: 'active' },

    // profile
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },

    // marketplace
    purchases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],

    // role-change
    roleChangeRequest: {
      requestedRole: { type: String, enum: ['Buyer', 'Artist'] },
      reason: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      decidedAt: { type: Date }
    }
  },
  { timestamps: true }
);

// ✅ Hash password before save (if modified/new)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Method to check password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
