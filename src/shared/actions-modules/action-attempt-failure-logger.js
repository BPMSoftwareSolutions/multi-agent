// warehouse:file
// responsibility: Logs action attempt failures with error details and status transitions
// actor: action_orchestrator
// role: failure_logger
// source_truth: implementation

// warehouse:method
// responsibility: Records action attempt failure with error code, message, and final status
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
