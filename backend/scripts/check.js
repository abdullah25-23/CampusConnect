const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');

function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'node_modules') inspect(full); continue; }
    if (full.endsWith('.js')) new vm.Script(fs.readFileSync(full, 'utf8'), { filename: full });
  }
}
inspect(path.resolve(__dirname, '..'));

const { calculatePriority } = require('../services/priorityService');
const { presentComplaint } = require('../services/complaintPresenter');
assert.equal(calculatePriority({ title: 'Exposed wire', description: 'In classroom' }).priority, 'high');
assert.equal(calculatePriority({ title: 'Suggestion', description: 'A new seating arrangement' }).priority, 'low');
assert.equal(calculatePriority({ title: 'Question', description: 'Library book availability' }).priority, 'medium');

const source = { confidential: true, student: { _id: 's001', name: 'Sensitive Student', email: 'private@example.com' }, history: [
  { status: 'pending', changedBy: 's001', changedByName: 'Sensitive Student', note: 'Created' },
  { status: 'in_progress', changedBy: 'a001', changedByName: 'Admin', note: 'Investigating' },
] };
const protectedView = presentComplaint(source, { role: 'department_admin' });
assert.equal(protectedView.student.name, 'Confidential student');
assert.equal(protectedView.student.email, undefined);
assert.equal(protectedView.student._id, undefined);
assert.equal(protectedView.history[0].changedByName, 'Confidential student');
assert.equal(protectedView.history[0].changedBy, undefined);
assert.equal(source.student.name, 'Sensitive Student'); // Presenter must never mutate the database object.
const superView = presentComplaint(source, { role: 'super_admin' });
assert.equal(superView.student.name, 'Sensitive Student');

console.log('Backend syntax, smart-priority and confidentiality checks passed.');
