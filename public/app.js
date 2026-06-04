// warehouse:file
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: browser_client
// role: implementation
// source_truth: implementation

const AppState = {
  apiKey: null,
  logs: [],
  loadingTicker: null,
  loadingStepIndex: 0,
  sessionId: null,
  currentStage: null,
  intent: null,
  stages: {
    idea: { artifact: null, proposedArtifact: null, accepted: false, rounds: [] },
    ascii: { artifact: null, proposedArtifact: null, accepted: false, rounds: [] },
    plan: { artifact: null, proposedArtifact: null, accepted: false, rounds: [] }
  },
  operations: {
    approvedActions: [],
    actionAttempts: [],
    humanReviewQueue: [],
    driveSyncState: { lastPolledAt: null }
  },
  drive: {
    authStatus: null,
    resolvedFolder: null,
    importing: false
  },
  sessionCatalog: {
    currentSessionId: null,
    sessions: []
  },
  pendingRound: {
    roundNumber: null,
    planner: null,
    reviewer: null,
    humanInterjection: "",
    artifactBefore: null
  },
  loading: false,
  loadingMessage: "",
  error: null,
  view: "start"
};

const stageLabels = {
  idea: "Idea",
  ascii: "ASCII Sketch",
  plan: "Implementation Plan"
};

const API_KEY_STORAGE_KEY = "mas_anthropic_api_key";

const els = {
  startView: document.getElementById("start-view"),
  workingView: document.getElementById("working-view"),
  briefInput: document.getElementById("brief-input"),
  startCurrentSessionLabel: document.getElementById("start-current-session-label"),
  startSessionSelect: document.getElementById("start-session-select"),
  refreshStartSessionsBtn: document.getElementById("refresh-start-sessions-btn"),
  loadStartSessionBtn: document.getElementById("load-start-session-btn"),
  loadCurrentSessionBtn: document.getElementById("load-current-session-btn"),
  startSessionInspectionContent: document.getElementById("start-session-inspection-content"),
  humanInput: document.getElementById("human-input"),
  stageStatus: document.getElementById("stage-status"),
  currentSessionLabel: document.getElementById("current-session-label"),
  sessionSelect: document.getElementById("session-select"),
  refreshSessionsBtn: document.getElementById("refresh-sessions-btn"),
  loadSessionBtn: document.getElementById("load-session-btn"),
  sessionInspectionContent: document.getElementById("session-inspection-content"),
  driveAuthStatus: document.getElementById("drive-auth-status"),
  drivePathInput: document.getElementById("drive-path-input"),
  driveStatusContent: document.getElementById("drive-status-content"),
  connectDriveBtn: document.getElementById("connect-drive-btn"),
  resolveDrivePathBtn: document.getElementById("resolve-drive-path-btn"),
  importDriveFolderBtn: document.getElementById("import-drive-folder-btn"),
  apiKeyStatus: document.getElementById("api-key-status"),
  setApiKeyBtn: document.getElementById("set-api-key-btn"),
  builderContent: document.getElementById("builder-content"),
  reviewerContent: document.getElementById("reviewer-content"),
  artifactContent: document.getElementById("artifact-content"),
  errorBanner: document.getElementById("error-banner"),
  startSessionBtn: document.getElementById("start-session-btn"),
  runRoundBtn: document.getElementById("run-round-btn"),
  acceptArtifactBtn: document.getElementById("accept-artifact-btn"),
  approveManualActionBtn: document.getElementById("approve-manual-action-btn"),
  runWorkerBtn: document.getElementById("run-worker-btn"),
  advanceStageBtn: document.getElementById("advance-stage-btn"),
  copyJsonBtn: document.getElementById("copy-json-btn"),
  copyMarkdownBtn: document.getElementById("copy-markdown-btn"),
  clearLogBtn: document.getElementById("clear-log-btn"),
  observabilityLog: document.getElementById("observability-log")
};

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function addLog(level, message, details) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    details: details || ""
  };

  AppState.logs = [entry, ...AppState.logs].slice(0, 200);
  renderObservability();
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function clearLogs() {
  AppState.logs = [];
  renderObservability();
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderObservability() {
  if (!els.observabilityLog) {
    return;
  }

  if (!AppState.logs.length) {
    els.observabilityLog.innerHTML = "<em>No logs yet.</em>";
    return;
  }

  els.observabilityLog.innerHTML = AppState.logs
    .map((log) => {
      const details = log.details ? `<div class=\"log-meta\">${escapeHtml(log.details)}</div>` : "";
      return `
        <div class="log-entry">
          <div class="log-meta">${escapeHtml(log.ts)} | ${escapeHtml(log.level.toUpperCase())}</div>
          <div class="log-message">${escapeHtml(log.message)}</div>
          ${details}
        </div>
      `;
    })
    .join("");
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderList(items) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    return "<em>None</em>";
  }
  return `<ul>${safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function currentStageState() {
  return AppState.currentStage ? AppState.stages[AppState.currentStage] : null;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function setError(message) {
  AppState.error = message;
  addLog("error", message);
  renderAll();
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function saveApiKey(key) {
  AppState.apiKey = key;
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function promptForApiKey() {
  const existing = AppState.apiKey || "";
  const entered = window.prompt(
    "Enter your Anthropic API key. It will be stored in browser local storage for this app.",
    existing
  );

  if (typeof entered === "string" && entered.trim() !== "") {
    saveApiKey(entered.trim());
    AppState.error = null;
  }

  renderAll();
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function ensureApiKeyAtStartup() {
  const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (stored && stored.trim()) {
    AppState.apiKey = stored.trim();
    return;
  }

  promptForApiKey();
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function api(path, options = {}) {
  const start = performance.now();
  const headers = {
    "Content-Type": "application/json"
  };

  if (AppState.apiKey) {
    headers["X-Anthropic-Api-Key"] = AppState.apiKey;
  }

  const response = await fetch(path, {
    headers,
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  const durationMs = Math.round(performance.now() - start);
  addLog(
    response.ok ? "info" : "warn",
    `${options.method || "GET"} ${path} -> ${response.status} (${durationMs}ms)`,
    payload && payload.traceId ? `traceId=${payload.traceId}` : ""
  );

  if (!response.ok) {
    const error = new Error(payload.error || `Request failed: ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function fetchDriveStatus() {
  try {
    const status = await api("/drive/auth/status");
    AppState.drive.authStatus = status;
    renderAll();
    return status;
  } catch (error) {
    AppState.drive.authStatus = {
      configured: false,
      authenticated: false,
      error: error.message
    };
    renderAll();
    return AppState.drive.authStatus;
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function fetchSessionCatalog() {
  try {
    const payload = await api("/session");
    AppState.sessionCatalog = payload;
    renderAll();
    return payload;
  } catch (error) {
    addLog("warn", "Failed to fetch session catalog", error.message);
    return null;
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function tryAutoLoadCurrentSession() {
  const currentSessionId = AppState.sessionCatalog.currentSessionId;
  if (!currentSessionId || AppState.sessionId) {
    return;
  }

  try {
    const session = await api(`/session/${currentSessionId}`);
    applySession(session);
    addLog("info", `Auto-loaded current session ${session.id}`);
  } catch (error) {
    addLog("warn", "Failed to auto-load current session", error.message);
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function applySession(session) {
  AppState.sessionId = session.id;
  AppState.currentStage = session.currentStage;
  AppState.intent = session.intent;
  AppState.stages = session.stages;
  AppState.operations = session.operations || AppState.operations;
  AppState.view = session.completed ? "done" : "working";
  if (AppState.sessionCatalog.currentSessionId !== session.id) {
    AppState.sessionCatalog.currentSessionId = session.id;
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function startRoundProgressTicker() {
  const steps = [
    "Running Planner...",
    "Running Reviewer..."
  ];

  AppState.loadingStepIndex = 0;
  AppState.loadingMessage = steps[0];
  addLog("info", steps[0]);

  AppState.loadingTicker = setInterval(() => {
    AppState.loadingStepIndex = (AppState.loadingStepIndex + 1) % steps.length;
    AppState.loadingMessage = steps[AppState.loadingStepIndex];
    addLog("info", AppState.loadingMessage);
    renderAll();
  }, 2500);
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function connectDrive() {
  try {
    const response = await api("/drive/auth/url");
    window.open(response.url, "drive-auth", "width=960,height=720");
    addLog("info", "Opened Google Drive authorization window");

    let attempts = 0;
// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
    const poll = async () => {
      attempts += 1;
      const status = await fetchDriveStatus();
      if (status.authenticated || attempts >= 20) {
        return;
      }
      window.setTimeout(poll, 3000);
    };

    window.setTimeout(poll, 3000);
  } catch (error) {
    setError(error.message);
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function resolveDrivePathAction() {
  const drivePath = els.drivePathInput.value.trim();
  if (!drivePath) {
    setError("Drive path is required.");
    return;
  }

  AppState.loading = true;
  AppState.loadingMessage = "Resolving Drive Path...";
  AppState.error = null;
  renderAll();

  try {
    const resolved = await api("/drive/resolve-path", {
      method: "POST",
      body: JSON.stringify({ path: drivePath })
    });
    AppState.drive.resolvedFolder = resolved;
    addLog("info", `Resolved Drive path to folder ${resolved.folderId}`);
  } catch (error) {
    setError(error.message);
  } finally {
    AppState.loading = false;
    AppState.loadingMessage = "";
    renderAll();
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function importDriveFolder() {
  if (!AppState.sessionId) {
    setError("Start a session before importing a Drive folder.");
    return;
  }

  const resolvedFolder = AppState.drive.resolvedFolder;
  if (!resolvedFolder || !resolvedFolder.folderId) {
    setError("Resolve a Drive path before importing.");
    return;
  }

  AppState.loading = true;
  AppState.loadingMessage = "Importing Drive Folder...";
  AppState.error = null;
  renderAll();

  try {
    const response = await api("/drive/import", {
      method: "POST",
      body: JSON.stringify({
        sessionId: AppState.sessionId,
        folderId: resolvedFolder.folderId,
        path: els.drivePathInput.value.trim()
      })
    });
    applySession(response.session);
    addLog(
      "info",
      `Imported Drive folder ${resolvedFolder.folderId} (${response.summary.importedFiles} files, ${response.summary.importedFolders} folders)`
    );
  } catch (error) {
    setError(error.message);
  } finally {
    AppState.loading = false;
    AppState.loadingMessage = "";
    renderAll();
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function stopRoundProgressTicker() {
  if (AppState.loadingTicker) {
    clearInterval(AppState.loadingTicker);
    AppState.loadingTicker = null;
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function fetchSession() {
  const session = await api(`/session/${AppState.sessionId}`);
  applySession(session);
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function loadSelectedSession() {
  const sessionId = AppState.view === "start" ? els.startSessionSelect.value : els.sessionSelect.value;
  if (!sessionId) {
    return;
  }

  AppState.loading = true;
  AppState.loadingMessage = "Loading Session...";
  AppState.error = null;
  renderAll();

  try {
    const session = await api(`/session/${sessionId}`);
    applySession(session);
    addLog("info", `Loaded session ${session.id}`);
  } catch (error) {
    setError(error.message);
  } finally {
    AppState.loading = false;
    AppState.loadingMessage = "";
    renderAll();
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function loadCurrentSession() {
  const sessionId = AppState.sessionCatalog.currentSessionId;
  if (!sessionId) {
    setError("No current session is stored in SQL.");
    return;
  }

  if (AppState.view === "start") {
    els.startSessionSelect.value = sessionId;
  } else {
    els.sessionSelect.value = sessionId;
  }

  await loadSelectedSession();
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function startSession() {
  const brief = els.briefInput.value.trim();
  if (!brief) {
    setError("Brief is required.");
    return;
  }

  AppState.loading = true;
  AppState.loadingMessage = "Starting session...";
  AppState.error = null;
  addLog("info", "Starting session");
  renderAll();

  try {
    const session = await api("/session/start", {
      method: "POST",
      body: JSON.stringify({ brief })
    });
    applySession(session);
    addLog("info", `Session started (${session.id})`);
  } catch (error) {
    setError(error.message);
  } finally {
    AppState.loading = false;
    AppState.loadingMessage = "";
    renderAll();
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function runRound() {
  if (!AppState.sessionId || !AppState.currentStage) {
    return;
  }

  AppState.loading = true;
  AppState.loadingMessage = "Running Planner...";
  AppState.error = null;
  addLog("info", `Running round on stage ${AppState.currentStage}`);
  startRoundProgressTicker();
  renderAll();

  try {
    const roundResponse = await api("/round/run", {
      method: "POST",
      body: JSON.stringify({
        sessionId: AppState.sessionId,
        humanInterjection: els.humanInput.value
      })
    });

    if (Array.isArray(roundResponse.trace)) {
      roundResponse.trace.forEach((event) => {
        addLog(
          event.status === "failed" ? "error" : "info",
          `Server ${event.step} ${event.status}`,
          event.details || ""
        );
      });
    }

    await fetchSession();
    const stage = currentStageState();
    const latestRound = stage.rounds[stage.rounds.length - 1] || null;
    AppState.pendingRound = latestRound
      ? {
          roundNumber: latestRound.roundNumber,
          planner: latestRound.planner,
          reviewer: latestRound.reviewer,
          humanInterjection: latestRound.humanInterjection || "",
          artifactBefore: latestRound.artifactBefore
        }
      : AppState.pendingRound;
    addLog("info", "Round completed and session refreshed");
  } catch (error) {
    if (error.payload && Array.isArray(error.payload.trace)) {
      error.payload.trace.forEach((event) => {
        addLog(
          event.status === "failed" ? "error" : "warn",
          `Server ${event.step} ${event.status}`,
          event.details || ""
        );
      });
    }
    setError(error.message);
  } finally {
    stopRoundProgressTicker();
    AppState.loading = false;
    AppState.loadingMessage = "";
    renderAll();
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function acceptArtifact() {
  if (!AppState.sessionId) {
    return;
  }

  AppState.loading = true;
  AppState.loadingMessage = "Accepting artifact...";
  AppState.error = null;
  addLog("info", "Accepting proposed artifact");
  renderAll();

  try {
    await api("/artifact/accept", {
      method: "POST",
      body: JSON.stringify({ sessionId: AppState.sessionId })
    });
    await fetchSession();
  } catch (error) {
    setError(error.message);
  } finally {
    AppState.loading = false;
    AppState.loadingMessage = "";
    renderAll();
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function runWorker() {
  if (!AppState.sessionId) {
    return;
  }

  AppState.loading = true;
  AppState.loadingMessage = "Running Worker...";
  AppState.error = null;
  addLog("info", "Executing next approved action");
  renderAll();

  try {
    const response = await api("/worker/run", {
      method: "POST",
      body: JSON.stringify({ sessionId: AppState.sessionId })
    });
    applySession(response.session);
    addLog("info", response.result.message || "Worker completed action");
  } catch (error) {
    setError(error.message);
  } finally {
    AppState.loading = false;
    AppState.loadingMessage = "";
    renderAll();
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function approveManualAction() {
  if (!AppState.sessionId) {
    return;
  }

  const seedPayload = {
    action_type: "rename",
    file_id: "drive_file_1",
    item_id: "drive_file_1",
    current_parent_id: "inbox",
    current_name: "draft.txt",
    new_name: "final.txt",
    approval_status: "approved",
    risk_level: "low"
  };

  const raw = window.prompt(
    "Enter manual action recommendation JSON to approve and queue.",
    JSON.stringify(seedPayload, null, 2)
  );

  if (!raw || !raw.trim()) {
    return;
  }

  let recommendation;
  try {
    recommendation = JSON.parse(raw);
  } catch (error) {
    setError(`Invalid manual action JSON: ${error.message}`);
    return;
  }

  AppState.loading = true;
  AppState.loadingMessage = "Approving Manual Action...";
  AppState.error = null;
  renderAll();

  try {
    const response = await api("/approval/action", {
      method: "POST",
      body: JSON.stringify({
        sessionId: AppState.sessionId,
        recommendation
      })
    });
    applySession(response.session);
    addLog("info", `Queued manual action(s): ${response.summary.enqueued}`);
  } catch (error) {
    setError(error.message);
  } finally {
    AppState.loading = false;
    AppState.loadingMessage = "";
    renderAll();
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderActionRecommendationList(actions) {
  const safeActions = Array.isArray(actions) ? actions : [];
  if (!safeActions.length) {
    return "<em>No structured action recommendations.</em>";
  }

  return `
    <ul>
      ${safeActions
        .map((action) => {
          const actionType = action.action_type || action.actionType || "unknown";
          const fileId = action.file_id || action.fileId || action.item_id || action.itemId || "unknown";
          const approvalStatus = action.approval_status || action.approvalStatus || "approved";
          const rationale = action.rationale ? ` - ${escapeHtml(action.rationale)}` : "";
          return `<li><strong>${escapeHtml(actionType)}</strong> on ${escapeHtml(fileId)} (${escapeHtml(approvalStatus)})${rationale}</li>`;
        })
        .join("")}
    </ul>
  `;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderOperationsSummary() {
  const operations = AppState.operations || {};
  const approvedActions = Array.isArray(operations.approvedActions) ? operations.approvedActions : [];
  const attempts = Array.isArray(operations.actionAttempts) ? operations.actionAttempts : [];
  const humanReviewQueue = Array.isArray(operations.humanReviewQueue)
    ? operations.humanReviewQueue
    : [];

  const queueHtml = approvedActions.length
    ? `
        <p><strong>Approved Action Queue</strong></p>
        <ul>
          ${approvedActions
            .map(
              (action) =>
                `<li>${escapeHtml(action.actionType)} | ${escapeHtml(action.fileId)} | ${escapeHtml(action.status)}</li>`
            )
            .join("")}
        </ul>
      `
    : "<p><strong>Approved Action Queue</strong></p><em>No queued actions.</em>";

  const humanReviewHtml = humanReviewQueue.length
    ? `
        <p><strong>Human Review Queue</strong></p>
        <ul>
          ${humanReviewQueue
            .map(
              (item) =>
                `<li>${escapeHtml(item.itemId)} | ${escapeHtml(item.riskLevel)} | ${escapeHtml(item.reason)}</li>`
            )
            .join("")}
        </ul>
      `
    : "<p><strong>Human Review Queue</strong></p><em>No blocked actions.</em>";

  const attemptsHtml = attempts.length
    ? `
        <p><strong>Recent Worker Attempts</strong></p>
        <ul>
          ${attempts
            .slice(-5)
            .reverse()
            .map((attempt) => {
              const label = attempt.errorCode ? `${attempt.actionId} | ${attempt.errorCode}` : `${attempt.actionId} | ok`;
              return `<li>${escapeHtml(label)}</li>`;
            })
            .join("")}
        </ul>
      `
    : "<p><strong>Recent Worker Attempts</strong></p><em>No worker runs yet.</em>";

  return `<hr />${queueHtml}${humanReviewHtml}${attemptsHtml}`;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderSessionInspector() {
  const catalog = AppState.sessionCatalog || { currentSessionId: null, sessions: [] };
  const sessions = Array.isArray(catalog.sessions) ? catalog.sessions : [];

  els.currentSessionLabel.textContent = AppState.sessionId
    ? `Current session: ${AppState.sessionId}`
    : "Current session: none";

  const selected = AppState.sessionId || catalog.currentSessionId || "";
  els.sessionSelect.innerHTML = sessions.length
    ? sessions
        .map((session) => {
          const label = `${session.brief} | ${session.currentStage} | ${session.id}`;
          const isSelected = session.id === selected ? " selected" : "";
          return `<option value="${escapeHtml(session.id)}"${isSelected}>${escapeHtml(label)}</option>`;
        })
        .join("")
    : '<option value="">No sessions found</option>';

  if (!AppState.sessionId) {
    els.sessionInspectionContent.innerHTML = "<em>No session loaded.</em>";
    return;
  }

  const ops = AppState.operations || {};
  const approvedActions = Array.isArray(ops.approvedActions) ? ops.approvedActions : [];
  const attempts = Array.isArray(ops.actionAttempts) ? ops.actionAttempts : [];
  const humanReview = Array.isArray(ops.humanReviewQueue) ? ops.humanReviewQueue : [];

  const actionHtml = approvedActions.length
    ? `<ul>${approvedActions
        .slice()
        .reverse()
        .map(
          (action) =>
            `<li><strong>${escapeHtml(action.actionType)}</strong> | ${escapeHtml(action.fileId)} | ${escapeHtml(action.status)} | ${escapeHtml(action.actionId)}</li>`
        )
        .join("")}</ul>`
    : "<em>No approved actions.</em>";

  const attemptHtml = attempts.length
    ? `<ul>${attempts
        .slice()
        .reverse()
        .slice(0, 10)
        .map((attempt) => {
          const summary = attempt.errorCode
            ? `${attempt.actionId} | ${attempt.errorCode}`
            : `${attempt.actionId} | ok`;
          return `<li>${escapeHtml(summary)}</li>`;
        })
        .join("")}</ul>`
    : "<em>No worker attempts.</em>";

  const humanReviewHtml = humanReview.length
    ? `<ul>${humanReview
        .map(
          (item) => `<li>${escapeHtml(item.itemId)} | ${escapeHtml(item.riskLevel)} | ${escapeHtml(item.reason)}</li>`
        )
        .join("")}</ul>`
    : "<em>No human review items.</em>";

  els.sessionInspectionContent.innerHTML = `
    <p><strong>Stage:</strong> ${escapeHtml(AppState.currentStage || "")}</p>
    <p><strong>Queue Counts:</strong> pending ${approvedActions.filter((action) => action.status === "pending").length}, done ${approvedActions.filter((action) => action.status === "done").length}, failed ${approvedActions.filter((action) => action.status === "failed").length}, blocked ${approvedActions.filter((action) => action.status === "blocked").length}</p>
    <p><strong>Approved Actions</strong></p>
    ${actionHtml}
    <p><strong>Worker Attempts</strong></p>
    ${attemptHtml}
    <p><strong>Human Review Queue</strong></p>
    ${humanReviewHtml}
  `;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderStartSessionInspector() {
  const catalog = AppState.sessionCatalog || { currentSessionId: null, sessions: [] };
  const sessions = Array.isArray(catalog.sessions) ? catalog.sessions : [];
  const currentSessionId = catalog.currentSessionId || "";

  els.startCurrentSessionLabel.textContent = currentSessionId
    ? `Current session: ${currentSessionId}`
    : "Current session: none";

  els.startSessionSelect.innerHTML = sessions.length
    ? sessions
        .map((session) => {
          const label = `${session.brief} | ${session.currentStage} | ${session.id}`;
          const isSelected = session.id === currentSessionId ? " selected" : "";
          return `<option value="${escapeHtml(session.id)}"${isSelected}>${escapeHtml(label)}</option>`;
        })
        .join("")
    : '<option value="">No sessions found</option>';

  if (!sessions.length) {
    els.startSessionInspectionContent.innerHTML = "<em>No SQL-backed sessions found yet.</em>";
    return;
  }

  const selectedId = els.startSessionSelect.value || currentSessionId;
  const selected = sessions.find((session) => session.id === selectedId) || sessions[0];
  if (!selected) {
    els.startSessionInspectionContent.innerHTML = "<em>No session selected.</em>";
    return;
  }

  const ops = selected.operations || {};
  els.startSessionInspectionContent.innerHTML = `
    <p><strong>Brief:</strong> ${escapeHtml(selected.brief)}</p>
    <p><strong>Stage:</strong> ${escapeHtml(selected.currentStage)}</p>
    <p><strong>Queue Counts:</strong> pending ${escapeHtml(String(ops.pendingActions || 0))}, done ${escapeHtml(String(ops.doneActions || 0))}, failed ${escapeHtml(String(ops.failedActions || 0))}, blocked ${escapeHtml(String(ops.blockedActions || 0))}</p>
    <p><strong>Updated:</strong> ${escapeHtml(selected.updatedAt || "")}</p>
  `;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function advanceStage() {
  if (!AppState.sessionId) {
    return;
  }

  AppState.loading = true;
  AppState.loadingMessage = "Advancing stage...";
  AppState.error = null;
  addLog("info", "Advancing stage");
  renderAll();

  try {
    await api("/stage/advance", {
      method: "POST",
      body: JSON.stringify({ sessionId: AppState.sessionId })
    });
    await fetchSession();
  } catch (error) {
    setError(error.message);
  } finally {
    AppState.loading = false;
    AppState.loadingMessage = "";
    renderAll();
  }
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderIdeaArtifact(artifact) {
  return `
    <p><strong>Name:</strong> ${escapeHtml(artifact.name)}</p>
    <p><strong>Concept:</strong> ${escapeHtml(artifact.concept)}</p>
    <p><strong>Target User:</strong> ${escapeHtml(artifact.target_user)}</p>
    <p><strong>Core Loop:</strong> ${escapeHtml(artifact.core_loop)}</p>
    <p><strong>Value:</strong> ${escapeHtml(artifact.value)}</p>
    <p><strong>Risks:</strong></p>
    ${renderList(artifact.risks)}
  `;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderAsciiArtifact(artifact) {
  return `
    <p><strong>Layout</strong></p>
    <pre>${escapeHtml(artifact.layout || "")}</pre>
    <p><strong>Regions:</strong></p>
    ${renderList(artifact.regions)}
    <p><strong>Interaction Notes:</strong> ${escapeHtml(artifact.interaction_notes || "")}</p>
    <p><strong>Open Questions:</strong></p>
    ${renderList(artifact.open_questions)}
  `;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderPlanArtifact(artifact) {
  return `
    <p><strong>MVP Scope:</strong></p>${renderList(artifact.mvp_scope)}
    <p><strong>Frontend Components:</strong></p>${renderList(artifact.frontend_components)}
    <p><strong>Backend Endpoints:</strong></p>${renderList(artifact.backend_endpoints)}
    <p><strong>State Model:</strong></p>${renderList(artifact.state_model)}
    <p><strong>Milestones:</strong></p>${renderList(artifact.milestones)}
    <p><strong>Deferred:</strong></p>${renderList(artifact.deferred)}
  `;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderArtifact() {
  const stage = currentStageState();
  if (!stage) {
    els.artifactContent.innerHTML = "<em>No session loaded.</em>";
    return;
  }

  const artifact = stage.proposedArtifact || stage.artifact;
  const badge = stage.proposedArtifact
    ? '<span class="badge proposed">Proposed</span>'
    : stage.accepted
      ? '<span class="badge accepted">Accepted</span>'
      : "";

  let body = "<em>Unsupported stage</em>";
  if (AppState.currentStage === "idea") {
    body = renderIdeaArtifact(artifact);
  } else if (AppState.currentStage === "ascii") {
    body = renderAsciiArtifact(artifact);
  } else if (AppState.currentStage === "plan") {
    body = renderPlanArtifact(artifact);
  }

  let metadata = "";
  const latestRound = stage.rounds[stage.rounds.length - 1] || null;
  if (latestRound && latestRound.reviewer) {
    const reviewer = latestRound.reviewer;
    metadata = `
      <hr />
      <p><strong>Change Summary:</strong></p>
      ${renderList(reviewer.change_summary)}
    `;
  }

  els.artifactContent.innerHTML = `${badge}${body}${metadata}${renderOperationsSummary()}`;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderBuilderPanel() {
  const stage = currentStageState();
  if (!stage) {
    els.builderContent.innerHTML = "<em>No planner output yet.</em>";
    return;
  }

  const latest = stage.rounds[stage.rounds.length - 1] || null;
  let html = latest
    ? `<pre>${escapeHtml(JSON.stringify(latest.planner.artifact, null, 2))}</pre>`
    : "<em>No rounds yet.</em>";

  if (stage.rounds.length > 1) {
    html += '<div class="history"><h3>History</h3>';
    stage.rounds.slice(0, -1).forEach((round) => {
      html += `
        <details>
          <summary>Round ${round.roundNumber}</summary>
          <pre>${escapeHtml(JSON.stringify(round.planner.artifact, null, 2))}</pre>
        </details>
      `;
    });
    html += "</div>";
  }

  els.builderContent.innerHTML = html;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderDrivePanel() {
  const status = AppState.drive.authStatus;
  const resolved = AppState.drive.resolvedFolder;

  if (!status) {
    els.driveAuthStatus.textContent = "Drive: checking status...";
  } else if (!status.configured) {
    els.driveAuthStatus.textContent = "Drive: not configured";
  } else if (!status.authenticated) {
    els.driveAuthStatus.textContent = "Drive: not connected";
  } else {
    const identity = status.user && status.user.emailAddress ? ` as ${status.user.emailAddress}` : "";
    els.driveAuthStatus.textContent = `Drive: connected${identity}`;
  }

  let html = "";
  if (status && status.error) {
    html += `<p><strong>Auth Error:</strong> ${escapeHtml(status.error)}</p>`;
  }

  if (resolved) {
    html += `
      <p><strong>Resolved Folder:</strong> ${escapeHtml(resolved.name || "(unknown)")}</p>
      <p><strong>Folder ID:</strong> ${escapeHtml(resolved.folderId)}</p>
    `;

    if (Array.isArray(resolved.resolvedSegments) && resolved.resolvedSegments.length) {
      html += `<p><strong>Resolved Segments:</strong></p><ul>${resolved.resolvedSegments
        .map((segment) => `<li>${escapeHtml(segment.name)} | ${escapeHtml(segment.id)}</li>`)
        .join("")}</ul>`;
    }
  } else {
    html += "<em>No Drive folder resolved yet.</em>";
  }

  els.driveStatusContent.innerHTML = html;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderReviewerPanel() {
  const stage = currentStageState();
  if (!stage) {
    els.reviewerContent.innerHTML = "<em>No reviewer output yet.</em>";
    return;
  }

  const latest = stage.rounds[stage.rounds.length - 1] || null;
  if (!latest) {
    els.reviewerContent.innerHTML = "<em>No rounds yet.</em>";
    return;
  }

  const reviewer = latest.reviewer;
  let html = `
    <p><strong>Intent Issues</strong></p>
    ${renderList(reviewer.intent_issues)}
    <p><strong>Complexity Issues</strong></p>
    ${renderList(reviewer.complexity_issues)}
    <p><strong>Validity Issues</strong></p>
    ${renderList(reviewer.validity_issues)}
    <p><strong>Action Recommendations</strong></p>
    ${renderActionRecommendationList(reviewer.action_recommendations)}
    <p><strong>Suggested Artifact</strong></p>
    <pre>${escapeHtml(JSON.stringify(reviewer.suggested_artifact, null, 2))}</pre>
  `;

  if (stage.rounds.length > 1) {
    html += '<div class="history"><h3>History</h3>';
    stage.rounds.slice(0, -1).forEach((round) => {
      html += `
        <details>
          <summary>Round ${round.roundNumber}</summary>
          <p><strong>Intent</strong></p>${renderList(round.reviewer.intent_issues)}
          <p><strong>Complexity</strong></p>${renderList(round.reviewer.complexity_issues)}
          <p><strong>Validity</strong></p>${renderList(round.reviewer.validity_issues)}
          <p><strong>Actions</strong></p>${renderActionRecommendationList(round.reviewer.action_recommendations)}
        </details>
      `;
    });
    html += "</div>";
  }

  els.reviewerContent.innerHTML = html;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function serializeMarkdown() {
  const stage = currentStageState();
  if (!stage) {
    return "";
  }

  const artifact = stage.proposedArtifact || stage.artifact || {};
  const lines = [`# ${stageLabels[AppState.currentStage]} Artifact`, ""];

  Object.entries(artifact).forEach(([key, value]) => {
    lines.push(`## ${key}`);
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push("- (none)");
      } else {
        value.forEach((item) => lines.push(`- ${item}`));
      }
    } else {
      lines.push(String(value || ""));
    }
    lines.push("");
  });

  return lines.join("\n");
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function copyJson() {
  const stage = currentStageState();
  if (!stage) {
    return;
  }

  const artifact = stage.proposedArtifact || stage.artifact || {};
  await navigator.clipboard.writeText(JSON.stringify(artifact, null, 2));
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function copyMarkdown() {
  await navigator.clipboard.writeText(serializeMarkdown());
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderHeader() {
  els.apiKeyStatus.textContent = AppState.apiKey
    ? "API key: set"
    : "API key: not set";

  if (AppState.view === "start") {
    els.stageStatus.textContent = "Start a workshop session to begin.";
    return;
  }

  if (AppState.view === "done") {
    els.stageStatus.textContent = "All stages completed.";
    return;
  }

  const stage = currentStageState();
  const rounds = stage ? stage.rounds.length : 0;
  els.stageStatus.textContent = `Stage: ${stageLabels[AppState.currentStage]} | Rounds: ${rounds}${AppState.loadingMessage ? ` | ${AppState.loadingMessage}` : ""}`;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderActions() {
  const stage = currentStageState();
  const disabled = AppState.loading || AppState.view !== "working";
  const approvedActions = Array.isArray(AppState.operations.approvedActions)
    ? AppState.operations.approvedActions
    : [];
  const hasPendingAction = approvedActions.some((action) => action.status === "pending");
  const canAccept = Boolean(stage && stage.proposedArtifact) && !disabled;
  const canAdvance = Boolean(stage && stage.accepted) && !disabled;

  els.runRoundBtn.disabled = disabled;
  els.acceptArtifactBtn.disabled = !canAccept;
  els.runWorkerBtn.disabled = disabled || !hasPendingAction;
  els.advanceStageBtn.disabled = !canAdvance;
  els.copyJsonBtn.disabled = disabled;
  els.copyMarkdownBtn.disabled = disabled;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderError() {
  if (!AppState.error) {
    els.errorBanner.classList.add("hidden");
    els.errorBanner.textContent = "";
    return;
  }
  els.errorBanner.classList.remove("hidden");
  els.errorBanner.textContent = AppState.error;
}

// warehouse:method
// responsibility: Coordinates addLog and clearLogs and renderObservability and escapeHtml and renderList and currentStageState and setError and saveApiKey and promptForApiKey and ensureApiKeyAtStartup and api and fetchDriveStatus and fetchSessionCatalog and tryAutoLoadCurrentSession and applySession and startRoundProgressTicker and connectDrive and poll and resolveDrivePathAction and importDriveFolder and stopRoundProgressTicker and fetchSession and loadSelectedSession and loadCurrentSession and startSession and runRound and acceptArtifact and runWorker and approveManualAction and renderActionRecommendationList and renderOperationsSummary and renderSessionInspector and renderStartSessionInspector and advanceStage and renderIdeaArtifact and renderAsciiArtifact and renderPlanArtifact and renderArtifact and renderBuilderPanel and renderDrivePanel and renderReviewerPanel and serializeMarkdown and copyJson and copyMarkdown and renderHeader and renderActions and renderError and renderAll behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderAll() {
  renderHeader();
  renderError();
  renderObservability();
  renderStartSessionInspector();
  renderSessionInspector();
  renderDrivePanel();

  const showWorking = AppState.view === "working" || AppState.view === "done";
  els.startView.classList.toggle("hidden", showWorking);
  els.workingView.classList.toggle("hidden", !showWorking);

  if (showWorking) {
    renderBuilderPanel();
    renderReviewerPanel();
    renderArtifact();
    renderActions();
  }
}

els.startSessionBtn.addEventListener("click", startSession);
els.refreshStartSessionsBtn.addEventListener("click", () => {
  fetchSessionCatalog().catch(() => {});
});
els.loadStartSessionBtn.addEventListener("click", loadSelectedSession);
els.loadCurrentSessionBtn.addEventListener("click", loadCurrentSession);
els.refreshSessionsBtn.addEventListener("click", () => {
  fetchSessionCatalog().catch(() => {});
});
els.loadSessionBtn.addEventListener("click", loadSelectedSession);
els.connectDriveBtn.addEventListener("click", connectDrive);
els.resolveDrivePathBtn.addEventListener("click", resolveDrivePathAction);
els.importDriveFolderBtn.addEventListener("click", importDriveFolder);
els.runRoundBtn.addEventListener("click", runRound);
els.acceptArtifactBtn.addEventListener("click", acceptArtifact);
els.approveManualActionBtn.addEventListener("click", approveManualAction);
els.runWorkerBtn.addEventListener("click", runWorker);
els.advanceStageBtn.addEventListener("click", advanceStage);
els.copyJsonBtn.addEventListener("click", () => copyJson().catch((err) => setError(err.message)));
els.copyMarkdownBtn.addEventListener("click", () => copyMarkdown().catch((err) => setError(err.message)));
els.setApiKeyBtn.addEventListener("click", promptForApiKey);
els.clearLogBtn.addEventListener("click", clearLogs);
els.humanInput.addEventListener("input", (event) => {
  AppState.pendingRound.humanInterjection = event.target.value;
});

ensureApiKeyAtStartup();
if (els.drivePathInput) {
  els.drivePathInput.value = "G:\\My Drive\\BPM Software Solutions";
}
fetchDriveStatus().catch(() => {});
fetchSessionCatalog().then(() => tryAutoLoadCurrentSession()).catch(() => {});
renderAll();
