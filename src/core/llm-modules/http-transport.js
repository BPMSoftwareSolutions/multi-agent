// warehouse:file
// responsibility: Performs HTTPS requests to language model APIs with error handling
// actor: core_runtime
// role: http_transport
// source_truth: implementation

const https = require("https");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
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

module.exports = { fetchFromAnthropicRaw };
