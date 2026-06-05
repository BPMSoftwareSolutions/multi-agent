// warehouse:file
// responsibility: Watches worker-bee log stream for real-time packet completion events, extracts progress counts and fallback triggers with timestamps and Outputs final progress summary with completion tallies from log watcher, reports recency status and stall indicators
// actor: log_watcher
// role: monitor
// source_truth: implementation

// Watch worker-bee progress in real-time: show actual completion events with timestamps

const fs = require("fs");
const path = require("path");
const readline = require("readline");

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

// warehouse:method
// responsibility: Watches worker-bee log stream for real-time packet completion events, extracts progress counts and fallback triggers with timestamps and Outputs final progress summary with completion tallies from log watcher, reports recency status and stall indicators
// actor: method_implementation
// role: implementation
// source_truth: implementation
const lineHandler = (line) => {
  // Match packet completion: [bee N] packet X/40 (NN files): NN ok, N error
  const packetMatch = line.match(/\[bee \d+\] packet \d+\/\d+ \((\d+) files\): (\d+) ok, (\d+) error/);
  if (packetMatch) {
    const filesInPacket = parseInt(packetMatch[1]);
    const filesOk = parseInt(packetMatch[2]);
    const filesError = parseInt(packetMatch[3]);

    if (filesOk > 0) {
      const now = new Date();
      lastProgressTime = now;
      totalCompleted += filesOk;

      console.log(`✅ [${now.toLocaleTimeString()}] ${filesOk} files completed (packet: ${filesInPacket})`);
    }

    if (filesError > 0) {
      const now = new Date();
      console.log(`⚠️  [${now.toLocaleTimeString()}] ${filesError} errors in packet`);
    }
  }

  // Match fallback events
  if (line.includes("falling back to Pro")) {
    const now = new Date();
    console.log(`↔️  [${now.toLocaleTimeString()}] Fallback triggered: Flash → Pro`);
  }
};

// warehouse:method
// responsibility: Watches worker-bee log stream for real-time packet completion events, extracts progress counts and fallback triggers with timestamps and Outputs final progress summary with completion tallies from log watcher, reports recency status and stall indicators
// actor: method_implementation
// role: implementation
// source_truth: implementation
const summaryHandler = () => {
  // Final summary
  console.log("\n═════════════════════════════════════════════════════════════════════════");
  console.log("Summary:");
  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log(`Total files completed: ${totalCompleted}`);
  if (lastProgressTime) {
    console.log(`Last progress: ${lastProgressTime.toLocaleTimeString()}`);
    const secondsAgo = Math.floor((Date.now() - lastProgressTime.getTime()) / 1000);
    if (secondsAgo < 60) {
      console.log(`⏱️  Progress is RECENT (${secondsAgo}s ago) ✅`);
    } else if (secondsAgo < 300) {
      console.log(`⏱️  Last update ${Math.floor(secondsAgo / 60)}m ago`);
    } else {
      console.log(`⚠️  STALLED — last progress ${Math.floor(secondsAgo / 60)}m ago`);
    }
  } else {
    console.log("❌ No progress detected");
  }
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
