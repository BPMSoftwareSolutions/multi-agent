// warehouse:file
// responsibility: Delegator: re-exports app state setter and getter for backward compatibility
// actor: shared
// role: app_state_persistence
// source_truth: implementation

const { setAppState } = require("./app-state-setter");
const { getAppState } = require("./app-state-getter");

module.exports = { setAppState, getAppState };
