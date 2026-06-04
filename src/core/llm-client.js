// warehouse:file
// responsibility: Anthropic API client: retrieves and validates API key, builds HTTPS requests, extracts JSON from model output, implements retry logic with exponential backoff
// actor: core_runtime
// role: llm_interface
// source_truth: implementation

const https = require("https");

const model = process.env.MODEL || "claude-sonnet-4-6";

// warehouse:method
// responsibility: Retrieves and validates the Anthropic API key from environment or override parameter
// actor: core_runtime
// role: credential_lookup
// source_truth: implementation
function getApiKey(overrideApiKey) {
  const apiKey = overrideApiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY or CLAUDE_API_KEY is not set");
  }
  return apiKey;
}

// warehouse:method
// responsibility: Extracts valid JSON from model output, attempting multiple parsing strategies (direct, code fence, brace extraction)
// actor: core_runtime
// role: response_parsing
// source_truth: implementation
function extractJSON(text) {
  if (typeof text !== "string") {
    throw new Error("Model output is not text");
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_err) {
    // Next attempt
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch (_err) {
      // Next attempt
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch (_err) {
      // No valid JSON found
    }
  }

  throw new Error("Could not extract JSON from model output");
}

// warehouse:method
// responsibility: Performs low-level HTTPS request to Anthropic API and returns parsed JSON response with error handling
// actor: core_runtime
// role: api_transport
// source_truth: implementation
async function fetchFromAnthropicRaw(endpoint, method, payload, apiKey) {
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      endpoint,
      {
        method,
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "accept": "application/json"
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              const error = new Error(
                parsed.error?.message || `HTTP ${res.statusCode}`
              );
              error.status = res.statusCode;
              error.apiError = parsed.error;
              reject(error);
            } else {
              resolve(parsed);
            }
          } catch (parseErr) {
            reject(new Error(`Failed to parse API response: ${parseErr.message}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// warehouse:method
// responsibility: Invokes Claude API with system prompt and messages, extracting text from response
// actor: core_runtime
// role: model_invocation
// source_truth: implementation
async function callClaude({ system, userMessages, maxTokens, apiKey }) {
  const key = getApiKey(apiKey);

  const response = await fetchFromAnthropicRaw(
    "https://api.anthropic.com/v1/messages",
    "POST",
    {
      model,
      max_tokens: maxTokens,
      system,
      messages: userMessages
    },
    key
  );

  const text = (response.content || [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  return text;
}

// warehouse:method
// responsibility: Calls Claude and retries on JSON parse errors up to maxAttempts, appending repair prompts to message chain
// actor: core_runtime
// role: retry_orchestration
// source_truth: implementation
async function callClaudeWithRetry(params, maxAttempts = 2) {
  const messages = [...(params.userMessages || [])];
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let outputText = "";
    try {
      outputText = await callClaude({
        system: params.system,
        userMessages: messages,
        maxTokens: params.maxTokens,
        apiKey: params.apiKey
      });
      return extractJSON(outputText);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        break;
      }

      const isJsonParseError =
        typeof error.message === "string" &&
        (error.message.includes("Could not extract JSON") ||
          error.message.includes("Unexpected token") ||
          error.message.includes("Expected ','") ||
          error.message.includes("JSON at position"));

      if (!isJsonParseError) {
        break;
      }

      if (outputText) {
        messages.push({ role: "assistant", content: outputText });
      }

      messages.push({
        role: "user",
        content:
          "Your previous response could not be parsed as JSON. Repair it and return only valid JSON matching the required schema, with no markdown, no comments, and no trailing commas."
      });
    }
  }

  throw lastError;
}

module.exports = {
  callClaude,
  callClaudeWithRetry,
  extractJSON
};
