// warehouse:file
// responsibility: Coordinates createApp behavior with documented file and method taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const path = require("path");
const express = require("express");
const cors = require("cors");

const sessionRoutes = require("./routes/session");
const roundRoutes = require("./routes/round");
const artifactRoutes = require("./routes/artifact");
const stageRoutes = require("./routes/stage");
const workerRoutes = require("./routes/worker");
const approvalRoutes = require("./routes/approval");
const driveRoutes = require("./routes/drive");

// warehouse:method
// responsibility: Coordinates createApp behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/session", sessionRoutes);
  app.use("/round", roundRoutes);
  app.use("/artifact", artifactRoutes);
  app.use("/stage", stageRoutes);
  app.use("/worker", workerRoutes);
  app.use("/approval", approvalRoutes);
  app.use("/drive", driveRoutes);

  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use((err, _req, res, _next) => {
    console.error(err);
    const status = Number(err && (err.status || err.statusCode)) || 500;
    const message = err && err.message ? err.message : "Internal server error";
    res.status(status).json({ error: message });
  });

  return app;
}

module.exports = {
  createApp
};
