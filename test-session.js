// warehouse:file
// responsibility: Coordinates test session module behavior with documented file taxonomy evidence
// actor: application_module
// role: implementation
// source_truth: implementation

const https = require('https');

const apiKey = process.env.CLAUDE_API_KEY;
if (!apiKey) {
  console.error('CLAUDE_API_KEY not set');
  process.exit(1);
}

const body = JSON.stringify({ brief: 'Build a workshop app with two AI agents debating' });

const options = {
  hostname: 'localhost',
  port: 3030,
  path: '/session/start',
  method: 'POST',
  headers: {
    'X-Anthropic-Api-Key': apiKey,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = require('http').request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Session ID:', json.session_id);
      console.log('Intent:', json.intent?.task_definition);
    } catch {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
