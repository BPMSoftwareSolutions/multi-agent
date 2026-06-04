// warehouse:file
// responsibility: undefined — failAttempt
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — failAttempt
// actor: method_implementation
// role: implementation
// source_truth: implementation
function failAttempt({ operations, action, attempt, code, message, status = "failed" }) {
  const finishedAt = new Date().toISOString();
  action.status = status;
  action.updatedAt = finishedAt;
  action.lastError = {
    code,
    message,
    at: finishedAt
  };
  attempt.finishedAt = finishedAt;
  attempt.errorCode = code;
  attempt.errorMessage = message;
  attempt.responseJson = { ok: false, code, message };
  operations.actionAttempts.push(attempt);

  return {
    ok: false,
    code,
    message,
    action,
    attempt
  };
}

module.exports = { failAttempt };
