// backend/models/Artwork.js
const mongoose = require('mongoose');

const ArtworkSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    tags: { type: [String], default: [] },

    // marketplace-related
    price: { type: Number, default: 0 },                // 0 = not for sale
    status: { type: String, enum: ['published', 'hidden', 'sold'], default: 'published' },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // <-- important
  },
  { timestamps: true }
);

module.exports = mongoose.model('Artwork', ArtworkSchema);
