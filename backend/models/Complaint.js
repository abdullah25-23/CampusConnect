const mongoose = require('mongoose');
const { randomBytes } = require('crypto');
const { STATUS_KEYS } = require('../utils/constants');

const remarkSchema = new mongoose.Schema({
  message: { type: String, required: true, maxlength: 2000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const historySchema = new mongoose.Schema({
  status: { type: String, enum: STATUS_KEYS, required: true },
  note: { type: String, maxlength: 2000, default: '' },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedByName: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
}, { _id: true });

const complaintSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true, default: () => `CC-${randomBytes(5).toString('hex').toUpperCase()}` },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true, index: true },
  location: { type: String, trim: true, maxlength: 150, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  imageUrl: { type: String, trim: true, maxlength: 1000, default: '' }, // Older complaints remain compatible.
  hasEvidence: { type: Boolean, default: false },
  confidential: { type: Boolean, default: false, index: true },
  priorityReason: { type: String, default: '' },
  prioritySource: { type: String, enum: ['auto', 'admin'], default: 'auto' },
  status: { type: String, enum: STATUS_KEYS, default: 'pending', index: true },
  remarks: { type: [remarkSchema], default: [] },
  history: { type: [historySchema], default: [] },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

complaintSchema.index({ student: 1, createdAt: -1 });
complaintSchema.index({ department: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
