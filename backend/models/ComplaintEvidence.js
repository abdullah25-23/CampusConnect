const mongoose = require('mongoose');

// Binary evidence is stored in Atlas, NOT on Render's ephemeral disk.
// One photo (<= 5 MB) per complaint keeps this simple and deployable.
const evidenceSchema = new mongoose.Schema({
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, unique: true },
  contentType: { type: String, enum: ['image/png', 'image/jpeg'], required: true },
  filename: { type: String, maxlength: 180, default: 'evidence' },
  data: { type: Buffer, required: true, select: false },
}, { timestamps: true });

module.exports = mongoose.model('ComplaintEvidence', evidenceSchema);
