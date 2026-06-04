// warehouse:file
// responsibility: Coordinates readProgress and getRunMetadata behavior with documented file and method taxonomy evidence
// actor: log_parser
// role: data_extractor
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Coordinates readProgress and getRunMetadata behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readProgress(logFile) {
  if (!fs.existsSync(logFile)) return { totalCompleted: 0, completions: [], totalErrors: 0 };

  const content = fs.readFileSync(logFile, "utf8");
  const lines = content.split("\n");

  let totalCompleted = 0;
  let totalErrors = 0;
  const completions = [];

  for (const line of lines) {
    const match = line.match(/\[bee \d+\] packet \d+\/\d+ \((\d+) files\): (\d+) ok, (\d+) error/);
    if (match) {
      const filesOk = parseInt(match[2]);
      const filesError = parseInt(match[3]);

      if (filesOk > 0) {
        completions.push(filesOk);
        totalCompleted += filesOk;
      }

      totalErrors += filesError;
    }
  }

  return { totalCompleted, completions, totalErrors };
}

// warehouse:method
// responsibility: Coordinates readProgress and getRunMetadata behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getRunMetadata(logFile) {
  let totalNeeded = 0;
  let agents = 3;
  let startedAt = null;

  try {
    const content = fs.readFileSync(logFile, "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      if (line.includes("files needing work:")) {
        const match = line.match(/files needing work:\s+(\d+)/);
        if (match) {
          totalNeeded = parseInt(match[1]);
        }
      }
      if (line.includes("bees,")) {
        const match = line.match(/(\d+)\s+bees/);
        if (match) {
          agents = parseInt(match[1]);
        }
      }
    }

    const logStats = fs.statSync(logFile);
    startedAt = logStats.birthtime || logStats.ctime;
  } catch (_e) {
    startedAt = new Date();
  }

  if (totalNeeded === 0) {
    totalNeeded = 1259;
  }

  if (typeof startedAt === 'string') {
    startedAt = new Date(startedAt);
  }

  return { startedAt, totalNeeded, agents };
}

module.exports = { readProgress, getRunMetadata };
