// warehouse:file
// responsibility: Aggregates package analysis and story formatting for taxonomy narratives
// actor: story_generator
// role: analyzer
// source_truth: implementation

const { analyzePackageStories } = require("./package-analyzer");
const { generateStory } = require("./story-formatter");

module.exports = { analyzePackageStories, generateStory };
