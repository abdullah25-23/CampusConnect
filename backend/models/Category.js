const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z][a-z0-9_-]{1,39}$/ },
  label: { type: String, required: true, trim: true, maxlength: 100 },
  department: { type: String, required: true, index: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
