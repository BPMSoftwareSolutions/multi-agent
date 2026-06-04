// warehouse:file
// responsibility: Delegator: orchestrates package analysis, contradiction detection, and reporting
// actor: contradiction_analyzer
// role: validator
// source_truth: implementation

const path = require("path");
const { loadPackageTaxonomy } = require("./package-loader");
const { analyzePackagesForContradictions } = require("./contradiction-analyzer");
const { sortAndSummarizeContradictions } = require("./contradiction-sorter");
const { analyzePackages } = require("../src/packages/contradiction-detector");

const root = path.resolve(__dirname, "..");
const taxonomyPath = path.resolve(root, "reports", "taxonomy-packages.json");

loadPackageTaxonomy(taxonomyPath);
const packages = analyzePackages(taxonomyPath);

const allContradictions = analyzePackagesForContradictions(taxonomyPath);
const report = sortAndSummarizeContradictions(allContradictions, Object.keys(packages).length);

console.log(JSON.stringify(report, null, 2));
