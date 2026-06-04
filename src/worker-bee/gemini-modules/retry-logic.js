// warehouse:file
// responsibility: Determines retry eligibility for API failures and implements exponential backoff strategy
// actor: worker_bee_infrastructure
// role: retry_manager
// source_truth: implementation

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504, 529]);

// warehouse:method
// responsibility: Determines retry eligibility for error conditions excluding authentication failures
// actor: worker_bee_infrastructure
// role: retry_manager
// source_truth: implementation
function isRetryable(error) {
  if (error.status === 401 || error.status === 403) return false; // auth: never retry
  if (RETRYABLE_STATUS.has(error.status)) return true;
  const msg = String(error.message || "").toLowerCase();
  return (
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("try again") ||
    msg.includes("rate") ||
    msg.includes("could not extract json") ||
    msg.includes("unexpected token") ||
    msg.includes("json at position") || // malformed JSON array/object
    msg.includes("expected ','") ||
    msg.includes("expected '") ||
    msg.includes("in json") ||
    msg.includes("no text") || // empty candidate / MAX_TOKENS finish
    msg.includes("timed out") ||
    error.code === "ECONNRESET" ||
    error.code === "ETIMEDOUT"
  );
}

// warehouse:method
// responsibility: Calculates exponential backoff delay strategy for API retry attempts
// actor: worker_bee_infrastructure
// role: retry_manager
// source_truth: implementation
function getBackoffDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt - 1), 8000);
}

module.exports = { isRetryable, getBackoffDelay, RETRYABLE_STATUS };
