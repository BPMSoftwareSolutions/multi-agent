// warehouse:file
// responsibility: Executes failure handling within action execution: marks action as failed/blocked, records error state in attempt log
// actor: shared
// role: attempt_failure_handler
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
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
