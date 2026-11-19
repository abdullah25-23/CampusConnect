const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('../models/Department');
const Category = require('../models/Category');
const User = require('../models/User');
const { requireAuth, permit } = require('../middleware/auth');
const { fail, clean } = require('../utils/http');

const router = express.Router();
router.use(requireAuth, permit('super_admin'));
const slugPattern = /^[a-z][a-z0-9_-]{1,39}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function slug(value) { return clean(value).toLowerCase().replace(/\s+/g, '-'); }
function nonempty(value, field, max = 100) {
  const text = clean(value);
  if (text.length < 2 || text.length > max) fail(400, `${field} must contain 2–${max} characters`);
  return text;
}
function validSlug(key) {
  if (!slugPattern.test(key)) fail(400, 'Key must start with a letter and contain 2–40 lowercase letters, numbers, - or _');
  return key;
}
function validId(id) { if (!mongoose.isValidObjectId(id)) fail(400, 'Invalid ID'); }
async function requireDepartment(key) {
  const department = await Department.findOne({ key, active: true });
  if (!department) fail(400, 'Select an active department');
  return department;
}

router.get('/departments', async (_req, res) => {
  const departments = await Department.find().sort({ name: 1 }).lean();
  res.json({ departments });
});
router.post('/departments', async (req, res) => {
  const name = nonempty(req.body?.name, 'Department name');
  const key = validSlug(slug(req.body?.key || name));
  if (await Department.exists({ key })) fail(409, 'Department key already exists');
  const department = await Department.create({ name, key });
  res.status(201).json({ message: 'Department created', department });
});
router.patch('/departments/:id', async (req, res) => {
  validId(req.params.id);
  const department = await Department.findById(req.params.id);
  if (!department) fail(404, 'Department not found');
  if (req.body.name !== undefined) department.name = nonempty(req.body.name, 'Department name');
  if (req.body.active !== undefined) {
    if (typeof req.body.active !== 'boolean') fail(400, 'active must be true or false');
    department.active = req.body.active;
  }
  await department.save();
  res.json({ message: 'Department updated', department });
});

router.get('/categories', async (_req, res) => {
  const categories = await Category.find().sort({ label: 1 }).lean();
  res.json({ categories });
});
router.post('/categories', async (req, res) => {
  const label = nonempty(req.body?.label, 'Category name');
  const key = validSlug(slug(req.body?.key || label));
  const department = slug(req.body?.department);
  await requireDepartment(department);
  if (await Category.exists({ key })) fail(409, 'Category key already exists');
  const category = await Category.create({ key, label, department });
  res.status(201).json({ message: 'Category created', category });
});
router.patch('/categories/:id', async (req, res) => {
  validId(req.params.id);
  const category = await Category.findById(req.params.id);
  if (!category) fail(404, 'Category not found');
  if (req.body.label !== undefined) category.label = nonempty(req.body.label, 'Category name');
  if (req.body.department !== undefined) {
    const department = slug(req.body.department);
    await requireDepartment(department);
    category.department = department; // Only future complaints are routed to the new department.
  }
  if (req.body.active !== undefined) {
    if (typeof req.body.active !== 'boolean') fail(400, 'active must be true or false');
    category.active = req.body.active;
  }
  await category.save();
  res.json({ message: 'Category updated', category });
});

function safeAdmin(user) {
  return { _id: user._id, name: user.name, email: user.email,
    department: user.department, active: user.active !== false, createdAt: user.createdAt };
}
router.get('/department-admins', async (_req, res) => {
  const admins = await User.find({ role: 'department_admin' }).sort({ createdAt: -1 });
  res.json({ admins: admins.map(safeAdmin) });
});
router.post('/department-admins', async (req, res) => {
  const name = nonempty(req.body?.name, 'Administrator name');
  const email = clean(req.body?.email).toLowerCase();
  const password = req.body?.password;
  const department = slug(req.body?.department);
  if (!emailPattern.test(email) || email.length > 254) fail(400, 'Enter a valid email');
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) fail(400, 'Administrator password must contain 10–128 characters');
  await requireDepartment(department);
  if (await User.exists({ email })) fail(409, 'Email already registered');
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({ name, email, passwordHash, role: 'department_admin', department, active: true });
  res.status(201).json({ message: 'Department administrator created', admin: safeAdmin(admin) });
});
router.patch('/department-admins/:id', async (req, res) => {
  validId(req.params.id);
  const admin = await User.findOne({ _id: req.params.id, role: 'department_admin' });
  if (!admin) fail(404, 'Department administrator not found');
  if (req.body.name !== undefined) admin.name = nonempty(req.body.name, 'Administrator name');
  if (req.body.department !== undefined) {
    const department = slug(req.body.department);
    await requireDepartment(department);
    admin.department = department;
  }
  if (req.body.active !== undefined) {
    if (typeof req.body.active !== 'boolean') fail(400, 'active must be true or false');
    admin.active = req.body.active;
  }
  await admin.save();
  res.json({ message: 'Administrator updated', admin: safeAdmin(admin) });
});
router.post('/department-admins/:id/reset-password', async (req, res) => {
  validId(req.params.id);
  const password = req.body?.password;
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) fail(400, 'Password must contain 10–128 characters');
  const admin = await User.findOne({ _id: req.params.id, role: 'department_admin' }).select('+passwordHash');
  if (!admin) fail(404, 'Administrator not found');
  admin.passwordHash = await bcrypt.hash(password, 10);
  await admin.save();
  res.json({ message: 'Administrator password reset' });
});

module.exports = router;
