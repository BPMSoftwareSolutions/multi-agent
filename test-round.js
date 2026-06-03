const http = require('http');

const apiKey = process.env.CLAUDE_API_KEY;
if (!apiKey) {
  console.error('CLAUDE_API_KEY not set');
  process.exit(1);
}

console.log('Testing /round/run endpoint...\n');

// First create a session
const sessionBody = JSON.stringify({ brief: 'Build a workshop app with two AI agents' });
const sessionOpts = {
  hostname: 'localhost',
  port: 3030,
  path: '/session/start',
  method: 'POST',
  headers: {
    'X-Anthropic-Api-Key': apiKey,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(sessionBody)
  }
};

let sessionId;

const sessionReq = http.request(sessionOpts, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      sessionId = json.id;
      console.log('✓ Session created:', sessionId);
      
      // Now run a round
      runRound();
    } catch (e) {
      console.error('Failed to parse session:', e.message);
    }
  });
});

sessionReq.on('error', (e) => console.error('Session error:', e.message));
sessionReq.write(sessionBody);
sessionReq.end();

function runRound() {
  const roundBody = JSON.stringify({ stage: 'intent', sessionId });
  const roundOpts = {
    hostname: 'localhost',
    port: 3030,
    path: '/round/run',
    method: 'POST',
    headers: {
      'X-Anthropic-Api-Key': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(roundBody)
    }
  };

  console.log('\nRunning round on "intent" stage...');
  const startTime = Date.now();

  const roundReq = http.request(roundOpts, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const elapsed = Date.now() - startTime;
      console.log(`✓ Round completed in ${elapsed}ms`);
      console.log(`Status code: ${res.statusCode}`);
      
      try {
        const json = JSON.parse(data);
        console.log(`Round status: ${json.status}`);
        if (json.trace && json.trace.length > 0) {
          console.log(`\nTrace events (${json.trace.length} total):`);
          json.trace.forEach((evt) => {
            console.log(`  - ${evt.event} (${evt.durationMs}ms)`);
          });
        }
        if (json.error) {
          console.log(`ERROR: ${json.error}`);
        }
      } catch (e) {
        console.log('Response:', data.substring(0, 200));
      }
      process.exit(0);
    });
  });

  roundReq.on('error', (e) => {
    console.error('Round error:', e.message);
    process.exit(1);
  });
  
  roundReq.write(roundBody);
  roundReq.end();
}
