// warehouse:file
// responsibility: Delegates legacy story report command usage to the current codebase story review report so stale taxonomy narratives cannot be regenerated
// actor: codebase_story_review_cli
// role: compatibility_command
// source_truth: implementation

const { runCodebaseStoryReviewReport } = require("./codebase-story-review-report");

if (require.main === module) {
  process.exit(runCodebaseStoryReviewReport());
}
