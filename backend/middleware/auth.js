const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { fail } = require('../utils/http');

async function requireAuth(req, res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return fail(401, 'Please log in to continue');
    if (!process.env.JWT_SECRET) return fail(500, 'JWT_SECRET is not configured');
    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); }
    catch { return fail(401, 'Invalid or expired token'); }
    const user = await User.findById(payload.userId);
    if (!user || user.active === false) return fail(401, 'Account is unavailable');
    req.user = user;
    next();
  } catch (error) { next(error); }
}

function permit(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new ErrorWithStatus(403, 'Access denied'));
    next();
  };
}

function ErrorWithStatus(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function complaintScope(user) {
  if (user.role === 'super_admin') return {};
  if (user.role === 'department_admin') return { department: user.department };
  return { student: user._id };
}

module.exports = { requireAuth, permit, complaintScope };
