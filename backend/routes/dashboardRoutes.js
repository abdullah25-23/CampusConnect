const express = require('express');
const Complaint = require('../models/Complaint');
const { requireAuth, complaintScope } = require('../middleware/auth');
const { STATUS_KEYS } = require('../utils/constants');
const { publicCatalog } = require('../services/catalogService');
const router = express.Router();
router.use(requireAuth);

// Every query uses the server-authorized user scope, including trends and location hotspots.
router.get('/stats', async (req, res) => {
  const match = complaintScope(req.user);
  const since = new Date(Date.now() - 6 * 86400000);
  since.setHours(0, 0, 0, 0);
  const [total, statusGroups, departmentGroups, categoryGroups, priorityGroups, recent,
    trendGroups, locationGroups, resolutionGroups, openOlderThan7Days, catalog] = await Promise.all([
    Complaint.countDocuments(match),
    Complaint.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $match: match }, { $group: { _id: '$department', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $match: match }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Complaint.find(match).select('ticketId title category department status priority confidential createdAt')
      .sort({ createdAt: -1 }).limit(5).lean(),
    Complaint.aggregate([{ $match: { ...match, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Karachi' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }]),
    Complaint.aggregate([{ $match: { ...match, location: { $exists: true, $nin: ['', null] } } },
      { $group: { _id: '$location', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    Complaint.aggregate([{ $match: { ...match, status: 'resolved', resolvedAt: { $ne: null } } },
      { $group: { _id: null, avgMs: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } } } }]),
    Complaint.countDocuments({ ...match, status: { $in: ['pending', 'in_progress'] }, createdAt: { $lt: new Date(Date.now() - 7 * 86400000) } }),
    publicCatalog(),
  ]);
  const groupsToMap = groups => Object.fromEntries(groups.map(item => [item._id, item.count]));
  const countsByStatus = groupsToMap(statusGroups);
  const departmentMap = groupsToMap(departmentGroups);
  const categoryMap = groupsToMap(categoryGroups);
  const knownDept = new Map(catalog.departments.map(d => [d.key, d.name]));
  const knownCat = new Map(catalog.categories.map(c => [c.key, c.label]));
  const allDept = [...new Set([...knownDept.keys(), ...departmentMapKeys(departmentMap)])];
  const allCat = [...new Set([...knownCat.keys(), ...departmentMapKeys(categoryMap)])];
  const daily = new Map(trendGroups.map(v => [v._id, v.count]));
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 86400000);
    const day = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' });
    return { date: day, count: daily.get(day) || 0 };
  });
  const byStatus = Object.fromEntries(STATUS_KEYS.map(key => [key, countsByStatus[key] || 0]));
  res.json({
    total, byStatus,
    byDepartment: allDept.map(key => ({ department: key, label: knownDept.get(key) || key, count: departmentMap[key] || 0 })),
    byCategory: allCat.map(key => ({ category: key, label: knownCat.get(key) || key, count: categoryMap[key] || 0 })),
    byPriority: { low: 0, medium: 0, high: 0, ...groupsToMap(priorityGroups) },
    resolutionRate: total ? Math.round((byStatus.resolved / total) * 100) : 0,
    avgResolutionHours: resolutionGroups.length ? Math.round((resolutionGroups[0].avgMs / 3600000) * 10) / 10 : null,
    openOlderThan7Days,
    last7Days,
    hotspots: locationGroups.map(g => ({ location: g._id, count: g.count })),
    recent,
  });
});
function departmentMapKeys(object) { return Object.keys(object); }
module.exports = router;
