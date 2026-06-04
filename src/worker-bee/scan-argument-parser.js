// warehouse:file
// responsibility: Parses and validates command arguments for taxonomy scanning operations — parseArgs
// actor: worker_bee_infrastructure
// role: argument_parser
// source_truth: implementation

const DEFAULT_REPO_ROOT = process.env.WORKER_BEE_REPO_ROOT;
if (!DEFAULT_REPO_ROOT) {
  throw new Error('Missing repo root configuration. Set WORKER_BEE_REPO_ROOT env var');
}

// warehouse:method
// responsibility: Parses and validates command arguments for taxonomy scanning operations — parseArgs
// actor: method_implementation
// role: implementation
// source_truth: implementation
function parseArgs(argv) {
  const args = { repoRoot: DEFAULT_REPO_ROOT, target: null, layer: "both", mode: "all", output: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
// warehouse:method
// responsibility: Parses and validates command arguments for taxonomy scanning operations — parseArgs
// actor: method_implementation
// role: implementation
// source_truth: implementation
    const next = () => argv[++i];
    switch (argv[i]) {
      case "--repo-root": args.repoRoot = next(); break;
      case "--target": args.target = next(); break;
      case "--layer": args.layer = next(); break;
      case "--mode": args.mode = next(); break;
      case "--output": args.output = next(); break;
      case "--json": args.json = true; break;
      default: console.error(`Unknown argument: ${argv[i]}`); process.exit(1);
    }
  }
  return args;
}

module.exports = { parseArgs, DEFAULT_REPO_ROOT };
