// warehouse:file
// responsibility: Coordinates drive module behavior with documented file taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const express = require("express");

const { getSession, touchSession } = require("../session/store");
const { requireString, optionalString } = require("../middleware/validate");
const { exchangeDriveCode, getDriveAuthStatus, getDriveAuthUrl } = require("../drive/client");
const {
  importDriveFolderToSession,
  listFolderChildren,
  resolveDrivePath
} = require("../drive/service");

const router = express.Router();

router.get("/auth/status", async (_req, res, next) => {
  try {
    const status = await getDriveAuthStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

router.get("/auth/url", (req, res, next) => {
  try {
    res.json({ url: getDriveAuthUrl(req) });
  } catch (error) {
    next(error);
  }
});

router.get("/auth/callback", async (req, res) => {
  if (req.query.error) {
    res.status(400).type("html").send(`
      <html><body>
      <h1>Google Drive connection failed</h1>
      <p>${String(req.query.error)}</p>
      </body></html>
    `);
    return;
  }

  const code = typeof req.query.code === "string" ? req.query.code.trim() : "";
  if (!code) {
    res.status(400).type("html").send("<html><body><h1>Missing OAuth code.</h1></body></html>");
    return;
  }

  try {
    await exchangeDriveCode(code);
    res.type("html").send(`
      <html>
        <body>
          <h1>Google Drive connected</h1>
          <p>You can return to Multi-Agent Studio.</p>
          <script>window.close();</script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(Number(error.status || 500)).type("html").send(`
      <html><body>
      <h1>Google Drive connection failed</h1>
      <p>${error.message}</p>
      </body></html>
    `);
  }
});

router.post("/resolve-path", async (req, res, next) => {
  try {
    const pathError = requireString(req.body, "path");
    if (pathError) {
      res.status(400).json({ error: pathError });
      return;
    }

    const resolved = await resolveDrivePath(req.body.path.trim());
    res.json(resolved);
  } catch (error) {
    next(error);
  }
});

router.get("/browse", async (req, res, next) => {
  try {
    const folderId =
      typeof req.query.folderId === "string" && req.query.folderId.trim()
        ? req.query.folderId.trim()
        : "root";
    const files = await listFolderChildren(folderId);
    res.json({ folderId, files });
  } catch (error) {
    next(error);
  }
});

router.post("/import", async (req, res, next) => {
  try {
    const sessionError = requireString(req.body, "sessionId");
    if (sessionError) {
      res.status(400).json({ error: sessionError });
      return;
    }

    const folderIdError = requireString(req.body, "folderId");
    if (folderIdError) {
      res.status(400).json({ error: folderIdError });
      return;
    }

    const pathError = optionalString(req.body, "path");
    if (pathError) {
      res.status(400).json({ error: pathError });
      return;
    }

    const session = getSession(req.body.sessionId.trim());
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const summary = await importDriveFolderToSession(session, {
      folderId: req.body.folderId.trim(),
      drivePath: typeof req.body.path === "string" ? req.body.path.trim() : null,
      maxDepth: Number(req.body.maxDepth || 4),
      maxItems: Number(req.body.maxItems || 500)
    });

    touchSession(session.id);
    res.json({ ok: true, summary, session });
  } catch (error) {
    next(error);
  }
});

module.exports = router;