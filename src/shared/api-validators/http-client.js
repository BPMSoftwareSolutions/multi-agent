// warehouse:file
// responsibility: Sends JSON POST requests with timeout handling and error extraction/parsing
// actor: api_client
// role: http_transport
// source_truth: implementation

const https = require("https");

// warehouse:method
// responsibility: Sends JSON POST request to HTTPS endpoint with configurable timeout, parses response
// actor: method_implementation
// role: implementation
// source_truth: implementation
function postJson(url, body, timeoutMs = 10000) {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "content-length": Buffer.byteLength(bodyStr),
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
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.write(bodyStr);
    req.end();
  });
}

module.exports = { postJson };
