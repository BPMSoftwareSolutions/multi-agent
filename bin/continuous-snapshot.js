#!/usr/bin/env node
// Continuous snapshot monitor: update progress report every 10 seconds

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const script = path.resolve(__dirname, "snapshot-progress.js");

console.log("📊 Starting continuous snapshot monitor (updates every 10s)...\n");

let updateCount = 0;

setInterval(() => {
  try {
    updateCount++;
    execSync(`node "${script}"`, { stdio: "pipe" });
    const now = new Date();
    console.log(`[${now.toLocaleTimeString()}] Update #${updateCount}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}, 10000);

// Keep process running
process.on("SIGINT", () => {
  console.log("\n✅ Monitor stopped");
  process.exit(0);
});
