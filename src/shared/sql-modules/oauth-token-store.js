// warehouse:file
// responsibility: Delegator: re-exports OAuth token setter and getter for backward compatibility
// actor: persistence_layer
// role: token_store
// source_truth: implementation

const { setOAuthToken } = require("./oauth-token-setter");
const { getOAuthToken } = require("./oauth-token-getter");

module.exports = { setOAuthToken, getOAuthToken };
