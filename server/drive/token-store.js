// warehouse:file
// responsibility: Coordinates readDriveTokens and writeDriveTokens behavior with documented file and method taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const { getOAuthToken, setOAuthToken } = require("../../src/shared/sql-server");

// warehouse:method
// responsibility: Coordinates readDriveTokens and writeDriveTokens behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readDriveTokens() {
  try {
    const tokenJson = getOAuthToken("google-drive");
    return tokenJson ? JSON.parse(tokenJson) : null;
  } catch {
    return null;
  }
}

// warehouse:method
// responsibility: Coordinates readDriveTokens and writeDriveTokens behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeDriveTokens(tokens) {
  setOAuthToken("google-drive", JSON.stringify(tokens));
}

module.exports = {
  readDriveTokens,
  writeDriveTokens
};