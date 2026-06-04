// warehouse:file
// responsibility: Log watcher: tails worker-bee log file and displays real-time events
// actor: log_watcher
// role: monitor
// source_truth: implementation

// Watch worker-bee progress in real-time: show actual completion events with timestamps

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { createLineHandler } = require("../src/worker-bee/monitor/log-event-handler");
const { generateSummary } = require("../src/worker-bee/monitor/progress-summary");

const logFile = path.resolve(__dirname, "..", ".worker-bee.log");

if (!fs.existsSync(logFile)) {
  console.error(`❌ Worker-bee log not found: ${logFile}`);
  process.exit(1);
}

console.log("👀 Watching worker-bee progress...\n");
console.log(`Log file: ${logFile}\n`);

// Track progress
let lastProgressTime = null;
let lastFilesCompleted = 0;
let totalCompleted = 0;

// Read file and follow tail
const stream = fs.createReadStream(logFile, { encoding: "utf8" });
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

// Create handlers
const lineHandler = createLineHandler(
  ({ timestamp, filesOk, filesInPacket, message }) => {
    lastProgressTime = timestamp;
    totalCompleted += filesOk;
    console.log(message);
  },
  ({ timestamp, filesError, message }) => {
    console.log(message);
  },
  ({ timestamp, message }) => {
    console.log(message);
  }
);

const summaryHandler = () => {
  console.log(generateSummary(totalCompleted, lastProgressTime));
};

rl.on("line", lineHandler);

rl.on("close", summaryHandler);

// Handle stream errors
stream.on("error", (err) => {
  console.error("Stream error:", err.message);
  process.exit(1);
});

rl.on("error", (err) => {
  if (err.code !== "ERR_USE_AFTER_CLOSE") {
    console.error("Readline error:", err.message);
  }
});
