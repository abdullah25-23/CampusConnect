// Predictable and explainable, rather than an opaque model or student-controlled score.
const CRITICAL_TERMS = [
  'fire', 'smoke', 'electric shock', 'exposed wire', 'live wire', 'broken glass',
  'harassment', 'assault', 'emergency', 'gas leak', 'injury', 'unsafe',
  'food poisoning', 'short circuit', 'security threat',
];
const HIGH_TERMS = [
  'not working', 'outage', 'broken', 'water leak', 'no internet', 'no wifi',
  'unable to', 'cannot access', 'exam tomorrow', 'deadline today',
  'power failure', 'hygiene', 'contaminated',
];
const LOW_TERMS = [
  'suggestion', 'recommendation', 'request more', 'would be nice', 'improve decor',
];

function calculatePriority({ title = '', description = '' }) {
  const text = `${title} ${description}`.toLowerCase();
  const critical = CRITICAL_TERMS.find(term => text.includes(term));
  if (critical) return { priority: 'high', reason: `Safety or urgent concern detected: ${critical}` };
  const high = HIGH_TERMS.find(term => text.includes(term));
  if (high) return { priority: 'high', reason: `Service disruption detected: ${high}` };
  const low = LOW_TERMS.find(term => text.includes(term));
  if (low) return { priority: 'low', reason: 'Routine suggestion or improvement request' };
  return { priority: 'medium', reason: 'Standard complaint requiring review' };
}

module.exports = { calculatePriority };
