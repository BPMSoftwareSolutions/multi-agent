// warehouse:file
// responsibility: Calculates progress metrics including velocity, time remaining, and percentage complete
// actor: snapshot_calculator
// role: metric_computer
// source_truth: implementation

// warehouse:method
// responsibility: Calculates files-per-minute velocity based on elapsed time and completion count
// actor: method_implementation
// role: implementation
// source_truth: implementation
function calculateVelocity(totalCompleted, elapsedMinutes) {
  if (elapsedMinutes <= 0) {
    return 0;
  }
  return totalCompleted / elapsedMinutes;
}

// warehouse:method
// responsibility: Estimates minutes remaining until completion at current velocity
// actor: method_implementation
// role: implementation
// source_truth: implementation
function calculateTimeRemaining(velocityFilesPerMin, remaining) {
  if (velocityFilesPerMin <= 0) {
    return Infinity;
  }
  return remaining / velocityFilesPerMin;
}

// warehouse:method
// responsibility: Calculates percentage of total work completed
// actor: method_implementation
// role: implementation
// source_truth: implementation
function calculatePercentComplete(totalCompleted, totalNeeded) {
  return Math.round((totalCompleted / totalNeeded) * 100);
}

// warehouse:method
// responsibility: Calculates files-per-second and seconds-per-file metrics
// actor: method_implementation
// role: implementation
// source_truth: implementation
function calculateDetailedMetrics(totalCompleted, elapsedSeconds) {
  const filesPerSecond = elapsedSeconds > 0 ? (totalCompleted / elapsedSeconds) : 0;
  const secondsPerFile = filesPerSecond > 0 ? (1 / filesPerSecond) : 0;
  return { filesPerSecond, secondsPerFile };
}

module.exports = {
  calculateVelocity,
  calculateTimeRemaining,
  calculatePercentComplete,
  calculateDetailedMetrics,
};
