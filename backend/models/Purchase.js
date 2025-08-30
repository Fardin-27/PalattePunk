// backend/models/Purchase.js
const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema(
  {
    artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
    buyer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price:   { type: Number, default: 0 },
    status:  { type: String, enum: ['paid', 'refunded', 'cancelled'], default: 'paid' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', PurchaseSchema);
