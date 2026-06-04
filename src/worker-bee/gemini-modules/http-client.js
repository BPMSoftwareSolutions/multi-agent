// warehouse:file
// responsibility: Sends HTTPS JSON requests with timeout handling and error extraction
// actor: worker_bee_infrastructure
// role: http_transport
// source_truth: implementation

const https = require("https");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function postJson(url, payload, timeoutMs = 30000) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "content-length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            let message = `HTTP ${res.statusCode}`;
            try {
              message = JSON.parse(data).error?.message || message;
            } catch (_e) {
              /* keep default */
            }
            const err = new Error(message);
            err.status = res.statusCode;
            reject(err);
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse Gemini response: ${e.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`API request timed out after ${timeoutMs}ms`));
    });
    req.write(body);
    req.end();
  });
}

module.exports = { postJson };
