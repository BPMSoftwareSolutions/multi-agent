// warehouse:file
// responsibility: Parses command-line arguments into swarm runtime configuration and packet overrides
// actor: argument_parser
// role: config_builder
// source_truth: implementation

const path = require("path");

// warehouse:method
// responsibility: Parses command-line arguments and packet overrides into swarm runtime configuration and execution parameters with defaults
// actor: method_implementation
// role: implementation
// source_truth: implementation
function parseArgs(argv, config, DEFAULT_REPO_ROOT) {
  const defaultTarget = config.defaultTarget ? path.resolve(DEFAULT_REPO_ROOT, config.defaultTarget) : null;
  const rt = { repoRoot: DEFAULT_REPO_ROOT, target: defaultTarget, limit: 0, dryRun: false, json: false, packetFile: null, help: false };
  const ov = { swarm: {}, workload: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      // runtime / location
      case "--repo-root": rt.repoRoot = next(); break;
      case "--target": rt.target = next(); break;
      case "--limit": rt.limit = parseInt(next(), 10); break;
      case "--dry-run": rt.dryRun = true; break;
      case "--json": rt.json = true; break;
      case "--status": rt.statusOnly = true; break;
      case "--packet": rt.packetFile = next(); break;
      case "--from": rt.fromFile = next(); break;
      // packet overrides
      case "--layer": ov.layer = next(); break;
      case "--mode": ov.mode = next(); break;
      case "--model": ov.model = next(); break;
      case "--agents": ov.swarm.agents = parseInt(next(), 10); break;
      case "--max-passes": ov.swarm.max_passes = parseInt(next(), 10); break;
      case "--files-per-packet": ov.workload.max_files_per_packet = parseInt(next(), 10); break;
      case "--anchor-budget": ov.workload.anchor_budget = parseInt(next(), 10); break;
      case "--method-batch": ov.workload.method_batch = parseInt(next(), 10); break;
      case "--max-output-tokens": ov.workload.max_output_tokens = parseInt(next(), 10); break;
      case "-h":
      case "--help": rt.help = true; break;
      default:
        console.error(`Unknown argument: ${a}`);
        process.exit(1);
    }
  }
  return { rt, ov };
}

const HELP = `Worker-bee: taxonomy-anchor swarm (Gemini)

The bee's workload is set by a PACKET (defaults <- --packet file <- flags).

Location / runtime:
  --repo-root <path>        Repo root for expected_location (default: \${DEFAULT_REPO_ROOT})
  --target <path>           Subtree to scan (default: same as repo-root)
  --limit <n>               Cap files this run (pilot mode)
  --from <tracking.json>    Drive the bee from a taxonomy-scan file (no re-scan)
  --packet <file.json>      Load a packet that determines the bee workload
  --dry-run                 Classify and show anchors, write nothing
  --json                    Machine-readable output
  --status                  Print the live status ledger (reports/status-latest.json) and exit

Packet overrides:
  --layer <file|method|both>        Which anchor layer(s)
  --mode <all|missing|revalidate>   What to process
  --model <name>                    Gemini model
  --agents <n>                      How many bees fly at once
  --max-passes <n>                  Self-heal: re-run until clean, up to n passes
  --files-per-packet <n>            Max files packed into one bee request
  --anchor-budget <n>               Max anchors (the "weight") per bee request
  --method-batch <n>                Methods per call for an oversize file
  --max-output-tokens <n>           Model output cap per request
`;

module.exports = { parseArgs, HELP };
