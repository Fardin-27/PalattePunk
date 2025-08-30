const mongoose = require('mongoose');

const RoleRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentRole: { type: String, enum: ['Buyer', 'Artist', 'Admin'], required: true },
    requestedRole: { type: String, enum: ['Buyer', 'Artist'], required: true }, // no direct request to Admin
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoleRequest', RoleRequestSchema);
