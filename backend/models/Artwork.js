const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const ArtworkSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    tags: { type: [String], default: [] },
    price: { type: Number }, // optional
    status: { type: String, enum: ['published', 'draft', 'deleted'], default: 'published' },
    comments: { type: [CommentSchema], default: [] }, // 👈 feedback lives here
  },
  { timestamps: true }
);

module.exports = mongoose.model('Artwork', ArtworkSchema);
