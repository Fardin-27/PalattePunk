const mongoose = require('mongoose');

const WishlistItemSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
  },
  { timestamps: true }
);

// Make each (user, artwork) pair unique
WishlistItemSchema.index({ user: 1, artwork: 1 }, { unique: true });

module.exports = mongoose.model('WishlistItem', WishlistItemSchema);
