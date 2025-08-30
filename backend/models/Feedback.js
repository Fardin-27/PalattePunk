// backend/models/Feedback.js
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    // --- canonical fields used by your current routes ---
    artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true, index: true },

    // keep BOTH 'author' and 'user' to be backward-compatible
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // used by routes (populate('author'))
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },              // legacy name

    // keep BOTH 'text' and 'content' to be backward-compatible
    text:    { type: String, trim: true },    // used by routes
    content: { type: String },                // legacy name

    hidden:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Normalize inputs so either naming works:
 * - prefer 'author' over 'user'
 * - prefer 'text' over 'content'
 */
FeedbackSchema.pre('validate', function (next) {
  // Map user/author both ways
  if (!this.author && this.user) this.author = this.user;
  if (!this.user && this.author) this.user = this.author;

  // Map content/text both ways
  if (!this.text && typeof this.content === 'string') this.text = this.content;
  if (!this.content && typeof this.text === 'string') this.content = this.text;

  // Basic required validations (after mapping)
  if (!this.author) {
    return next(new Error('author (or user) is required'));
  }
  if (!this.text || !this.text.trim()) {
    return next(new Error('text (or content) is required'));
  }
  this.text = this.text.trim();

  next();
});

// Helpful compound index for listing feedback by artwork newest-first
FeedbackSchema.index({ artwork: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
