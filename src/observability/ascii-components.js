// warehouse:file
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: ascii_component_renderer
// role: renderer
// source_truth: implementation

const PROGRESS_STYLES = {
  digital_block: {
    filled: "\u2588",
    empty: "\u2591",
    frame: false,
  },
  segmented: {
    filled: "\u25b0",
    empty: "\u25b1",
    frame: false,
  },
  thin_line: {
    filled: "\u2501",
    empty: "\u2500",
    frame: false,
  },
  ascii_basic: {
    filled: "#",
    empty: "-",
    frame: true,
  },
  numeric_only: {
    numeric_only: true,
    frame: false,
  },
};

const DEFAULT_PROGRESS_CONTRACT = {
  component_key: "progress_bar",
  component_kind: "ascii.progress",
  contract_version: "ascii_component.v1",
  bindings: {
    value: "$.score.value",
    max: "$.score.max",
    label: "$.score.label",
    status: "$.status",
  },
  rendering: {
    width: 24,
    style: "digital_block",
    show_percent: true,
    show_fraction: false,
  },
  authority: {
    source_truth_required: true,
    fail_on_missing_binding: true,
  },
};

const STATUS_ICON_MAPPINGS = {
  pass: { icon: "✅", fallback: "[OK]" },
  fail: { icon: "❌", fallback: "[NO]" },
  warning: { icon: "⚠", fallback: "[WARN]" },
  blocked: { icon: "⛔", fallback: "[BLOCKED]" },
  pending: { icon: "⏳", fallback: "[PENDING]" },
  running: { icon: "🔄", fallback: "[RUNNING]" },
  locked: { icon: "🔒", fallback: "[LOCKED]" },
  denied: { icon: "🚫", fallback: "[DENIED]" },
  evidence: { icon: "🧾", fallback: "[EVIDENCE]" },
  file: { icon: "📄", fallback: "[FILE]" },
  projection: { icon: "🖥", fallback: "[PROJECTION]" },
  ship: { icon: "🚚", fallback: "[SHIP]" },
};

const DEFAULT_STATUS_ICON_CONTRACT = {
  component_key: "status_icon",
  component_kind: "ascii.status_icon",
  contract_version: "ascii_component.v1",
  icon_mode: {
    primary: "unicode",
    fallback: "ascii_safe",
  },
  rendering: {
    mode: "unicode",
    uppercase_label: true,
  },
  authority: {
    source_truth_required: true,
    fail_on_missing_mapping: true,
  },
};

// warehouse:method
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function mergeProgressContract(contract = {}) {
  return {
    ...DEFAULT_PROGRESS_CONTRACT,
    ...contract,
    bindings: {
      ...DEFAULT_PROGRESS_CONTRACT.bindings,
      ...(contract.bindings || {}),
    },
    rendering: {
      ...DEFAULT_PROGRESS_CONTRACT.rendering,
      ...(contract.rendering || {}),
    },
    authority: {
      ...DEFAULT_PROGRESS_CONTRACT.authority,
      ...(contract.authority || {}),
    },
  };
}

// warehouse:method
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function mergeStatusIconContract(contract = {}) {
  return {
    ...DEFAULT_STATUS_ICON_CONTRACT,
    ...contract,
    icon_mode: {
      ...DEFAULT_STATUS_ICON_CONTRACT.icon_mode,
      ...(contract.icon_mode || {}),
    },
    rendering: {
      ...DEFAULT_STATUS_ICON_CONTRACT.rendering,
      ...(contract.rendering || {}),
    },
    authority: {
      ...DEFAULT_STATUS_ICON_CONTRACT.authority,
      ...(contract.authority || {}),
    },
  };
}

// warehouse:method
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getStatusIconMapping(meaning) {
  const mapping = STATUS_ICON_MAPPINGS[meaning];
  if (!mapping) {
    throw new Error(`Unknown status icon meaning: ${meaning}`);
  }
  return mapping;
}

// warehouse:method
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderStatusSignal(meaning, label, options = {}) {
  const contract = mergeStatusIconContract(options.contract || {});
  const mapping = getStatusIconMapping(meaning);
  const mode = options.mode || contract.rendering.mode;
  const icon = mode === contract.icon_mode.fallback ? mapping.fallback : mapping.icon;
  const text = contract.rendering.uppercase_label ? String(label).toUpperCase() : String(label);
  return `${icon} ${text}`;
}

// warehouse:method
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function clampProgressValue(value, max) {
  if (typeof value !== "number" || typeof max !== "number" || max <= 0) {
    return null;
  }
  return Math.max(0, Math.min(value, max));
}

// warehouse:method
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatProgressPercent(value, max) {
  const clamped = clampProgressValue(value, max);
  if (clamped === null) {
    return null;
  }
  return Math.round((clamped / max) * 100);
}

// warehouse:method
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getProgressStyle(styleName) {
  const style = PROGRESS_STYLES[styleName];
  if (!style) {
    throw new Error(`Unknown progress bar style: ${styleName}`);
  }
  return style;
}

// warehouse:method
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderPendingProgress(width, style) {
  if (style.numeric_only) {
    return "pending";
  }
  const pendingBar = style.empty.repeat(width);
  const rendered = style.frame ? `[${pendingBar}]` : pendingBar;
  return `${rendered} pending`;
}

// warehouse:method
// responsibility: Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderProgressBar(options = {}) {
  const contract = mergeProgressContract(options.contract || {});
  const rendering = contract.rendering;
  const max = typeof options.max === "number" ? options.max : 100;
  const width = rendering.width;
  const style = getProgressStyle(options.style || rendering.style);
  const percent = formatProgressPercent(options.value, max);

  if (percent === null) {
    return renderPendingProgress(width, style);
  }
  if (style.numeric_only) {
    return rendering.show_fraction ? `${options.value}/${max} ${percent}%` : `${percent}%`;
  }

  const filled = Math.round((percent / 100) * width);
  const bar = `${style.filled.repeat(filled)}${style.empty.repeat(width - filled)}`;
  const rendered = style.frame ? `[${bar}]` : bar;
  const parts = [rendered];
  if (rendering.show_fraction) {
    parts.push(`${options.value}/${max}`);
  }
  if (rendering.show_percent) {
    parts.push(`${percent}%`);
  }
  return parts.join(" ");
}

module.exports = {
  DEFAULT_PROGRESS_CONTRACT,
  DEFAULT_STATUS_ICON_CONTRACT,
  PROGRESS_STYLES,
  STATUS_ICON_MAPPINGS,
  formatProgressPercent,
  getProgressStyle,
  getStatusIconMapping,
  mergeProgressContract,
  mergeStatusIconContract,
  renderProgressBar,
  renderStatusSignal,
};
