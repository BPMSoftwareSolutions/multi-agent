// warehouse:file
// responsibility: Coordinates getDriveConfig and ensureDriveConfigured and createOAuthClient and getDriveAuthUrl and exchangeDriveCode and getAuthorizedDrive and getDriveAuthStatus behavior with documented file and method taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const { google } = require("googleapis");

const { readDriveTokens, writeDriveTokens } = require("./token-store");

const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.metadata"
];

// warehouse:method
// responsibility: Coordinates getDriveConfig and ensureDriveConfigured and createOAuthClient and getDriveAuthUrl and exchangeDriveCode and getAuthorizedDrive and getDriveAuthStatus behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getDriveConfig() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || "";
  const redirectUri =
    process.env.GOOGLE_DRIVE_REDIRECT_URI ||
    `http://localhost:${Number(process.env.PORT || 3030)}/drive/auth/callback`;

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: redirectUri.trim()
  };
}

// warehouse:method
// responsibility: Coordinates getDriveConfig and ensureDriveConfigured and createOAuthClient and getDriveAuthUrl and exchangeDriveCode and getAuthorizedDrive and getDriveAuthStatus behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function ensureDriveConfigured() {
  const config = getDriveConfig();
  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    const error = new Error(
      "Google Drive OAuth is not configured. Set GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, and GOOGLE_DRIVE_REDIRECT_URI."
    );
    error.status = 500;
    throw error;
  }
  return config;
}

// warehouse:method
// responsibility: Coordinates getDriveConfig and ensureDriveConfigured and createOAuthClient and getDriveAuthUrl and exchangeDriveCode and getAuthorizedDrive and getDriveAuthStatus behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function createOAuthClient() {
  const config = ensureDriveConfigured();
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
}

// warehouse:method
// responsibility: Coordinates getDriveConfig and ensureDriveConfigured and createOAuthClient and getDriveAuthUrl and exchangeDriveCode and getAuthorizedDrive and getDriveAuthStatus behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getDriveAuthUrl() {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: DRIVE_SCOPES
  });
}

// warehouse:method
// responsibility: Coordinates getDriveConfig and ensureDriveConfigured and createOAuthClient and getDriveAuthUrl and exchangeDriveCode and getAuthorizedDrive and getDriveAuthStatus behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function exchangeDriveCode(code) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  writeDriveTokens(tokens);
  return tokens;
}

// warehouse:method
// responsibility: Coordinates getDriveConfig and ensureDriveConfigured and createOAuthClient and getDriveAuthUrl and exchangeDriveCode and getAuthorizedDrive and getDriveAuthStatus behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function getAuthorizedDrive() {
  const oauth2Client = createOAuthClient();
  const tokens = readDriveTokens();
  if (!tokens) {
    const error = new Error("Google Drive is not authenticated. Connect Drive first.");
    error.status = 401;
    throw error;
  }

  oauth2Client.setCredentials(tokens);
  oauth2Client.on("tokens", (nextTokens) => {
    const merged = {
      ...tokens,
      ...nextTokens
    };
    writeDriveTokens(merged);
  });

  return {
    drive: google.drive({ version: "v3", auth: oauth2Client }),
    auth: oauth2Client
  };
}

// warehouse:method
// responsibility: Coordinates getDriveConfig and ensureDriveConfigured and createOAuthClient and getDriveAuthUrl and exchangeDriveCode and getAuthorizedDrive and getDriveAuthStatus behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function getDriveAuthStatus() {
  const tokens = readDriveTokens();
  const config = getDriveConfig();
  const status = {
    configured: Boolean(config.clientId && config.clientSecret && config.redirectUri),
    authenticated: Boolean(tokens),
    redirectUri: config.redirectUri,
    user: null
  };

  if (!status.configured || !tokens) {
    return status;
  }

  try {
    const { drive } = await getAuthorizedDrive();
    const about = await drive.about.get({
      fields: "user(displayName,emailAddress), storageQuota(limit,usage)",
      supportsAllDrives: true
    });
    status.user = about.data.user || null;
    status.storageQuota = about.data.storageQuota || null;
  } catch (error) {
    status.authenticated = false;
    status.error = error.message;
  }

  return status;
}

module.exports = {
  getDriveAuthStatus,
  getDriveAuthUrl,
  exchangeDriveCode,
  getAuthorizedDrive
};