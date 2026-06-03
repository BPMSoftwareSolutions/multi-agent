#!/usr/bin/env node
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

rl.on("line", (line) => {
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
});

rl.on("close", () => {
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
});

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
