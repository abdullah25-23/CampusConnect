// Confidentiality is enforced in the API response, not merely by the React UI.
function presentComplaint(complaint, user) {
  const result = complaint.toObject ? complaint.toObject() : { ...complaint };
  if (user.role === 'department_admin' && result.confidential) {
    result.student = { name: 'Confidential student' }; // Never expose ID or email.
    if (result.history) {
      result.history = result.history.map(event => {
        if (String(event.changedBy) === String(complaint.student?._id || complaint.student)) {
          return { ...event, changedBy: undefined, changedByName: 'Confidential student' };
        }
        return event;
      });
    }
  }
  return result;
}
module.exports = { presentComplaint };
