const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { fail, clean } = require('../utils/http');
const router = express.Router();

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department };
}

function issueToken(user) {
  if (!process.env.JWT_SECRET) fail(500, 'JWT_SECRET is not configured');
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Student registration only. The client cannot register itself as admin.
router.post('/register', async (req, res) => {
  const name = clean(req.body?.name);
  const email = clean(req.body?.email).toLowerCase();
  const password = req.body?.password;
  if (name.length < 2 || name.length > 100) fail(400, 'Name must contain 2–100 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fail(400, 'Enter a valid email');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) fail(400, 'Password must contain 8–128 characters');
  if (await User.exists({ email })) fail(409, 'Email already registered');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: 'student', department: null });
  res.status(201).json({ message: 'Registration successful', token: issueToken(user), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const email = clean(req.body?.email).toLowerCase();
  const password = req.body?.password;
  if (!email || typeof password !== 'string') fail(400, 'Email and password are required');
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || user.active === false || !(await bcrypt.compare(password, user.passwordHash))) fail(401, 'Invalid email or password');
  res.json({ message: 'Login successful', token: issueToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
module.exports = router;
