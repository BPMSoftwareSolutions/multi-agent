const { getOAuthToken, setOAuthToken } = require("../../src/shared/sql-server");

function readDriveTokens() {
  try {
    const tokenJson = getOAuthToken("google-drive");
    return tokenJson ? JSON.parse(tokenJson) : null;
  } catch {
    return null;
  }
}

function writeDriveTokens(tokens) {
  setOAuthToken("google-drive", JSON.stringify(tokens));
}

module.exports = {
  readDriveTokens,
  writeDriveTokens
};