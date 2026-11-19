const Department = require('../models/Department');
const Category = require('../models/Category');
const { CATEGORIES } = require('../utils/constants');

// Idempotent: upgrades existing databases without deleting complaints or admins.
async function ensureDefaultCatalog() {
  for (const item of CATEGORIES) {
    await Department.updateOne({ key: item.department }, {
      $setOnInsert: { key: item.department, name: item.departmentName, active: true },
    }, { upsert: true });
    await Category.updateOne({ key: item.key }, {
      $setOnInsert: { key: item.key, label: item.label, department: item.department, active: true },
    }, { upsert: true });
  }
}

async function publicCatalog() {
  const [departments, categories] = await Promise.all([
    Department.find({ active: true }).sort({ name: 1 }).lean(),
    Category.find({ active: true }).sort({ label: 1 }).lean(),
  ]);
  const allowed = new Set(departments.map(d => d.key));
  const names = Object.fromEntries(departments.map(d => [d.key, d.name]));
  return {
    departments: departments.map(({ key, name }) => ({ key, name })),
    categories: categories.filter(c => allowed.has(c.department)).map(c => ({
      key: c.key, label: c.label, department: c.department, departmentName: names[c.department],
    })),
  };
}

module.exports = { ensureDefaultCatalog, publicCatalog };
