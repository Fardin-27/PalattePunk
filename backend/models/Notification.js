// backend/models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'info' },
    title: { type: String, required: true },
    body:  { type: String, default: '' },
    meta:  { type: Object, default: {} },
    isRead:{ type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Sort index for faster listing (user newest-first)
NotificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
