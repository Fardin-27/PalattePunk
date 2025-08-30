// backend/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['paid', 'refunded', 'cancelled'], default: 'paid' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
