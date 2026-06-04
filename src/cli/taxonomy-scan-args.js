// warehouse:file
// responsibility: Parses command-line arguments for taxonomy scan operation
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Parses command-line arguments for taxonomy scan operation
// actor: method_implementation
// role: implementation
// source_truth: implementation
function parseTaxonomyScanArgs(argv, defaultRepoRoot) {
  const args = { repoRoot: defaultRepoRoot, target: null, layer: "both", mode: "all", output: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
// warehouse:method
// responsibility: Parses command-line arguments for taxonomy scan operation
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

module.exports = { parseTaxonomyScanArgs };
