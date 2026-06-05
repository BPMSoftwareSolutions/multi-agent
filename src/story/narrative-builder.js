// warehouse:file
// responsibility: Gets health indicator emoji and label based on coherence score and Builds narrative interpretation of file's story based on responsibility and methods
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Gets health indicator emoji and label based on coherence score and Builds narrative interpretation of file's story based on responsibility and methods
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getHealthIndicator(score) {
  if (score >= 70) return "✅ STRONG";
  if (score >= 50) return "⚠️  MODERATE";
  if (score >= 30) return "❌ WEAK";
  return "🚨 INCOHERENT";
}

// warehouse:method
// responsibility: Gets health indicator emoji and label based on coherence score and Builds narrative interpretation of file's story based on responsibility and methods
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildNarrative(file, analysis) {
  const narratives = [];

  narratives.push(`## **File Story: ${file.file.responsibility}**`);
  narratives.push("");
  narratives.push(
    `**Actor:** ${file.file.actor} | **Role:** ${file.file.role} | **Source:** ${file.file.source_truth}`
  );
  narratives.push("");

  if (file.methods.length === 0) {
    narratives.push("*No methods to document.*");
  } else {
    narratives.push("### What the Methods Do:");
    narratives.push("");

    for (const method of file.methods) {
      const isAligned = method.taxonomy.responsibility.toLowerCase().includes(
        file.file.responsibility.split(/\s+/)[0].toLowerCase()
      );
      const indicator = isAligned ? "✓" : "✗";
      narratives.push(`${indicator} **${method.name}()** — ${method.taxonomy.responsibility}`);
    }
  }

  narratives.push("");
  narratives.push("### Story Coherence Analysis:");
  narratives.push("");
  narratives.push(`**Health:** ${getHealthIndicator(analysis.coherenceScore)} (${analysis.coherenceScore}/100)`);
  narratives.push(`**Methods Aligned:** ${analysis.alignedMethods}/${analysis.totalMethods}`);
  narratives.push("");

  if (analysis.issues.length > 0) {
    narratives.push("#### Issues Detected:");
    narratives.push("");
    for (const issue of analysis.issues) {
      const reasons = Array.isArray(issue.reasons) && issue.reasons.length ? issue.reasons.join(", ") : "incoherent_responsibility";
      narratives.push(`- **${issue.method}()** (${reasons})`);
      narratives.push(`  - Says: "${issue.methodResp}"`);
      narratives.push("");
    }
  } else {
    narratives.push("✅ No major coherence issues detected.");
    narratives.push("");
  }

  const alignmentPercent = analysis.totalMethods > 0
    ? Math.round((analysis.alignedMethods / analysis.totalMethods) * 100)
    : 0;

  narratives.push("#### What the Story Says:");
  narratives.push("");

  if (analysis.coherenceScore >= 70) {
    narratives.push(
      `The file's purpose (${file.file.responsibility}) is well-supported by its methods. ` +
      `Each method contributes meaningfully to the overall responsibility.`
    );
  } else if (analysis.coherenceScore >= 50) {
    narratives.push(
      `The file's methods generally support its stated purpose, though some ` +
      `methods diverge into technical implementation details. ` +
      `The narrative is mostly coherent with ${alignmentPercent}% method alignment.`
    );
  } else if (analysis.coherenceScore >= 30) {
    narratives.push(
      `⚠️  **FALSE NARRATIVE WARNING:** The file claims to "${file.file.responsibility}" ` +
      `but many methods (${100 - alignmentPercent}%) describe unrelated technical tasks. ` +
      `The file's description may not accurately reflect what it actually does.`
    );
  } else {
    narratives.push(
      `🚨 **INCOHERENT STORY:** The file's stated purpose ` +
      `("${file.file.responsibility}") is almost entirely disconnected from ` +
      `what its methods actually do. This represents a broken narrative where ` +
      `the description and implementation tell contradictory stories.`
    );
  }

  narratives.push("");
  return narratives.join("\n");
}

module.exports = { getHealthIndicator, buildNarrative };
