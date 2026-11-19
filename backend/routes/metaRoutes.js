const express = require('express');
const { STATUS_KEYS } = require('../utils/constants');
const { publicCatalog } = require('../services/catalogService');
const router = express.Router();
router.get('/categories', async (_req, res) => {
  const catalog = await publicCatalog();
  res.json({ categories: catalog.categories });
});
router.get('/departments', async (_req, res) => {
  const catalog = await publicCatalog();
  res.json({ departments: catalog.departments });
});
router.get('/statuses', (_req, res) => res.json({ statuses: STATUS_KEYS }));
module.exports = router;
