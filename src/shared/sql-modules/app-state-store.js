// warehouse:file
// responsibility: Delegates app state persistence to focused modules; orchestrates get/set operations
// actor: shared
// role: app_state_store_delegator
// source_truth: implementation

const { getAppState } = require("./app-state-getter");
const { setAppState } = require("./app-state-setter");

module.exports = { setAppState, getAppState };
