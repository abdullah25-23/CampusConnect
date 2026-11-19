const express = require('express');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const ComplaintEvidence = require('../models/ComplaintEvidence');
const Category = require('../models/Category');
const Department = require('../models/Department');
const { requireAuth, complaintScope, permit } = require('../middleware/auth');
const { STATUS_KEYS } = require('../utils/constants');
const { fail, clean, escapeRegExp } = require('../utils/http');
const { acceptImage, verifyImage } = require('../middleware/upload');
const { calculatePriority } = require('../services/priorityService');
const { presentComplaint } = require('../services/complaintPresenter');

const router = express.Router();
router.use(requireAuth);
const validateId = id => { if (!mongoose.isValidObjectId(id)) fail(400, 'Invalid complaint ID'); };
function validateImageUrl(value) {
  if (!value) return '';
  const url = clean(value);
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || url.length > 1000) throw new Error('Invalid URL');
    return url;
  } catch { fail(400, 'imageUrl must be an http(s) image URL'); }
}

router.post('/', permit('student'), acceptImage, async (req, res) => {
  const title = clean(req.body?.title);
  const description = clean(req.body?.description);
  const categoryKey = clean(req.body?.category).toLowerCase();
  const location = clean(req.body?.location);
  const confidential = req.body?.confidential === true || req.body?.confidential === 'true';
  if (title.length < 5 || title.length > 150) fail(400, 'Title must contain 5–150 characters');
  if (description.length < 10 || description.length > 5000) fail(400, 'Description must contain 10–5000 characters');
  if (location.length > 150) fail(400, 'Location must contain at most 150 characters');
  const category = await Category.findOne({ key: categoryKey, active: true });
  if (!category) fail(400, 'Select an active complaint category');
  if (!await Department.exists({ key: category.department, active: true })) fail(400, 'This department is not currently accepting complaints');
  verifyImage(req.file);
  const imageUrl = req.file ? '' : validateImageUrl(req.body?.imageUrl); // Legacy JSON support.
  const { priority, reason } = calculatePriority({ title, description });
  const complaint = await Complaint.create({
    student: req.user._id, title, description, category: category.key,
    department: category.department, location, priority, priorityReason: reason,
    prioritySource: 'auto', imageUrl, confidential, hasEvidence: Boolean(req.file),
    history: [{ status: 'pending', note: 'Complaint submitted and automatically assigned',
      changedBy: req.user._id, changedByName: req.user.name }],
  });
  try {
    if (req.file) {
      await ComplaintEvidence.create({
        complaint: complaint._id, contentType: req.file.mimetype,
        filename: clean(req.file.originalname).slice(0, 180), data: req.file.buffer,
      });
    }
  } catch (error) {
    await Complaint.deleteOne({ _id: complaint._id });
    throw error;
  }
  res.status(201).json({ message: 'Complaint submitted successfully', complaint });
});

router.get('/', async (req, res) => {
  const filter = { ...complaintScope(req.user) };
  if (req.query.status) {
    if (!STATUS_KEYS.includes(req.query.status)) fail(400, 'Invalid status filter');
    filter.status = req.query.status;
  }
  if (req.query.category) filter.category = clean(req.query.category).slice(0, 40);
  if (req.query.department) {
    if (req.user.role !== 'super_admin') fail(403, 'Department filter is reserved for Super Admin');
    filter.department = clean(req.query.department).slice(0, 40);
  }
  if (req.query.priority) {
    if (!['low', 'medium', 'high'].includes(req.query.priority)) fail(400, 'Invalid priority');
    filter.priority = req.query.priority;
  }
  const search = clean(req.query.search).slice(0, 80);
  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { ticketId: regex }];
  }
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 15));
  const [complaints, total] = await Promise.all([
    Complaint.find(filter).select('-history -remarks').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('student', 'name email').lean(),
    Complaint.countDocuments(filter),
  ]);
  res.json({ complaints: complaints.map(c => presentComplaint(c, req.user)),
    pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.get('/:id/evidence', async (req, res) => {
  validateId(req.params.id);
  const complaint = await Complaint.findOne({ _id: req.params.id, ...complaintScope(req.user) }).select('_id hasEvidence');
  if (!complaint) fail(404, 'Complaint not found or access denied');
  if (!complaint.hasEvidence) fail(404, 'No uploaded image');
  const evidence = await ComplaintEvidence.findOne({ complaint: complaint._id }).select('+data');
  if (!evidence) fail(404, 'Image unavailable');
  res.set({ 'Content-Type': evidence.contentType, 'Content-Length': String(evidence.data.length),
    'Content-Disposition': 'inline', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  res.send(evidence.data);
});

router.get('/:id', async (req, res) => {
  validateId(req.params.id);
  const complaint = await Complaint.findOne({ _id: req.params.id, ...complaintScope(req.user) })
    .populate('student', 'name email');
  if (!complaint) fail(404, 'Complaint not found or access denied');
  res.json({ complaint: presentComplaint(complaint, req.user) });
});

router.patch('/:id/status', permit('department_admin', 'super_admin'), async (req, res) => {
  validateId(req.params.id);
  const status = clean(req.body?.status);
  const note = clean(req.body?.note || req.body?.remark);
  if (!STATUS_KEYS.includes(status)) fail(400, 'Invalid complaint status');
  if (note.length > 2000) fail(400, 'Remark is too long');
  if (status === 'rejected' && !note) fail(400, 'A rejection reason is required');
  const complaint = await Complaint.findOne({ _id: req.params.id, ...complaintScope(req.user) });
  if (!complaint) fail(404, 'Complaint not found or access denied');
  if (complaint.status === status && !note) fail(400, 'Status is already set to this value');
  complaint.status = status;
  complaint.resolvedAt = status === 'resolved' ? new Date() : null;
  complaint.history.push({ status, note, changedBy: req.user._id, changedByName: req.user.name });
  if (note) complaint.remarks.push({ message: note, author: req.user._id, authorName: req.user.name });
  await complaint.save();
  res.json({ message: 'Complaint status updated', complaint: presentComplaint(complaint, req.user) });
});

router.patch('/:id/priority', permit('department_admin', 'super_admin'), async (req, res) => {
  validateId(req.params.id);
  const priority = clean(req.body?.priority);
  const note = clean(req.body?.note);
  if (!['low', 'medium', 'high'].includes(priority)) fail(400, 'Invalid priority');
  if (note.length > 500) fail(400, 'Priority note is too long');
  const complaint = await Complaint.findOne({ _id: req.params.id, ...complaintScope(req.user) });
  if (!complaint) fail(404, 'Complaint not found or access denied');
  complaint.priority = priority;
  complaint.prioritySource = 'admin';
  complaint.priorityReason = note || `Reviewed by ${req.user.name}`;
  complaint.history.push({ status: complaint.status, note: `Priority updated to ${priority}: ${complaint.priorityReason}`,
    changedBy: req.user._id, changedByName: req.user.name });
  await complaint.save();
  res.json({ message: 'Priority updated', complaint: presentComplaint(complaint, req.user) });
});

router.post('/:id/remarks', permit('department_admin', 'super_admin'), async (req, res) => {
  validateId(req.params.id);
  const message = clean(req.body?.message);
  if (!message || message.length > 2000) fail(400, 'Remark must contain 1–2000 characters');
  const complaint = await Complaint.findOne({ _id: req.params.id, ...complaintScope(req.user) });
  if (!complaint) fail(404, 'Complaint not found or access denied');
  complaint.remarks.push({ message, author: req.user._id, authorName: req.user.name });
  await complaint.save();
  res.status(201).json({ message: 'Remark added', complaint: presentComplaint(complaint, req.user) });
});

module.exports = router;
