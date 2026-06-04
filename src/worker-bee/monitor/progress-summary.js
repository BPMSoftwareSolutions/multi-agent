// warehouse:file
// responsibility: Outputs final progress summary with completion tallies from log watcher, reports recency status and stall indicators
// actor: summary_printer
// role: display_engine
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function generateSummary(totalCompleted, lastProgressTime) {
  const lines = [
    "",
    "═════════════════════════════════════════════════════════════════════════",
    "Summary:",
    "═════════════════════════════════════════════════════════════════════════",
    `Total files completed: ${totalCompleted}`
  ];

  if (lastProgressTime) {
    lines.push(`Last progress: ${lastProgressTime.toLocaleTimeString()}`);
    const secondsAgo = Math.floor((Date.now() - lastProgressTime.getTime()) / 1000);
    if (secondsAgo < 60) {
      lines.push(`⏱️  Progress is RECENT (${secondsAgo}s ago) ✅`);
    } else if (secondsAgo < 300) {
      lines.push(`⏱️  Last update ${Math.floor(secondsAgo / 60)}m ago`);
    } else {
      lines.push(`⚠️  STALLED — last progress ${Math.floor(secondsAgo / 60)}m ago`);
    }
  } else {
    lines.push("❌ No progress detected");
  }

  return lines.join("\n");
}

module.exports = { generateSummary };
