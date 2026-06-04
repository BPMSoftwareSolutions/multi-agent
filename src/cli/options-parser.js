// warehouse:file
// responsibility: Parses CLI options and arguments
// actor: argument_parser
// role: config_builder
// source_truth: implementation

// warehouse:method
// responsibility: Parses CLI command-line arguments into structured studio configuration options and flags for handler routing
// actor: argument_parser
// role: config_builder
// source_truth: implementation
function parseOptions(args) {
  const options = {
    positional: [],
    json: false,
    note: null,
    session: null,
    payload: null,
    payloadFile: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--note" && i + 1 < args.length) {
      options.note = args[++i];
    } else if (arg === "--session" && i + 1 < args.length) {
      options.session = args[++i];
      options.sessionId = args[i];
    } else if (arg === "--payload" && i + 1 < args.length) {
      options.payload = args[++i];
    } else if (arg === "--payload-file" && i + 1 < args.length) {
      options.payloadFile = args[++i];
    } else if (!arg.startsWith("--")) {
      options.positional.push(arg);
    }
  }

  return options;
}

module.exports = { parseOptions };
