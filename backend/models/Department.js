const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z][a-z0-9_-]{1,39}$/ },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
