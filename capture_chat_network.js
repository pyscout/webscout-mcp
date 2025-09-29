// capture_chat_network.js
// Node 18+ recommended
// Usage: node capture_chat_network.js "https://chat.akash.network/"

const { chromium } = require('playwright');

async function run(targetUrl) {
  if (!targetUrl) {
    console.error('Usage: node capture_chat_network.js "<url>"');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,
    args: ['--auto-open-devtools-for-tabs'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Create CDP session to capture low-level network events (including websockets)
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');

  // Storage for captured items
  const requests = []; // {requestId, url, method, timestamp}
  const responses = []; // {requestId, url, status, mimeType, body}
  const wsFrames = []; // {requestId, timestamp, opcode, payload}

  // Network.requestWillBeSent
  client.on('Network.requestWillBeSent', (params) => {
    try {
      const { requestId, request, timestamp } = params;
      requests.push({ requestId, url: request.url, method: request.method, timestamp });
    } catch (e) { /* ignore */ }
  });

  // Network.responseReceived -> attempt to get body
  client.on('Network.responseReceived', async (params) => {
    try {
      const { requestId, response } = params;
      const url = response.url;
      const mimeType = response.mimeType || '';
      const status = response.status;
      // Only attempt to get body for likely JSON/text responses (avoid large images)
      if (mimeType.includes('json') || mimeType.includes('text') || url.match(/\.(php|api|graphql|json)$/i) || /api|model|chat|complete|generate|response/i.test(url)) {
        let body = null;
        try {
          const rb = await client.send('Network.getResponseBody', { requestId });
          body = rb && rb.body ? rb.body : null;
        } catch (err) {
          body = `<<could not get body: ${err.message}>>`;
        }
        responses.push({ requestId, url, status, mimeType, body });
      } else {
        responses.push({ requestId, url, status, mimeType, body: null });
      }
    } catch (e) { /* ignore */ }
  });

  // Capture WebSocket frames (if the site uses websockets for streaming)
  client.on('Network.webSocketFrameReceived', (params) => {
    try {
      const { requestId, timestamp, response } = params;
      wsFrames.push({ requestId, timestamp, opcode: response.opcode, payload: response.payloadData });
    } catch (e) { /* ignore */ }
  });
  client.on('Network.webSocketFrameSent', (params) => {
    // optional: capture outgoing frames
  });

  // Navigate
  console.log('Opening page:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  // Wait a bit for the UI to settle
  await page.waitForTimeout(1500);

  // Try to focus a chat input and send "hi"
  // We'll try several strategies and report which succeeded.
  let sendResult = { method: null, ok: false, note: '' };

  const trySend = async () => {
    // 1) Look for common input/selectors
    const selectors = [
      'textarea', // generic
      'input[type="text"]',
      '[contenteditable="true"]', // contenteditable chat boxes
      'div[role="textbox"]',
      '.chat-input textarea',
      '.composer textarea',
      'input[name="message"]',
      '.message-input',
      'form textarea',
    ];

    for (const sel of selectors) {
      const el = await page.$(sel);
      if (!el) continue;
      try {
        await el.focus();
        await page.keyboard.type('hi');
        await page.keyboard.press('Enter');
        sendResult = { method: `selector:${sel}`, ok: true, note: 'typed and Enter pressed' };
        return;
      } catch (e) {
        // ignore and try next
      }
    }

    // 2) Try clicking a "Send" button after typing into contenteditable or textarea
    // Type into first textarea or contenteditable
    const textarea = await page.$('textarea') || await page.$('[contenteditable="true"]');
    if (textarea) {
      try {
        await textarea.focus();
        await page.keyboard.type('hi');
        // try find send button
        const sendButtons = await page.$$('button');
        for (const b of sendButtons) {
          const txt = (await b.innerText()).toLowerCase();
          if (txt.includes('send') || txt.includes('submit') || txt.includes('reply')) {
            await b.click();
            sendResult = { method: 'typed+clicked-send', ok: true, note: `clicked button text="${txt}"` };
            return;
          }
        }
        // fallback: press Enter
        await page.keyboard.press('Enter');
        sendResult = { method: 'typed+enter-fallback', ok: true, note: 'typed then Enter' };
        return;
      } catch (e) {
        // ignore
      }
    }

    // 3) Try generic click at center then type then Enter (last resort)
    try {
      await page.mouse.click(600, 700); // rough guess; might place focus
      await page.keyboard.type('hi');
      await page.keyboard.press('Enter');
      sendResult = { method: 'mouse-fallback', ok: true, note: 'clicked arbitrary location then typed' };
      return;
    } catch (e) {
      sendResult = { method: 'all-failed', ok: false, note: e.message };
    }
  };

  await trySend();
  console.log('Send attempt result:', sendResult);

  // Now capture network traffic for a short window after sending
  const captureWindowMs = 8000; // 8 seconds; increase if site responds slowly
  console.log(`Capturing network events for ${captureWindowMs}ms after send...`);
  await page.waitForTimeout(captureWindowMs);

  // Post-processing: find candidate response(s) that happened after send
  // Use timestamps from requests array (CDP timestamps are seconds since epoch)
  // We'll conservatively look at responses array and wsFrames.
  console.log('\n--- Candidate HTTP responses captured (filtered) ---');
  const interesting = responses.filter(r => {
    // prefer responses with bodies and json/text mime or API-like URLs
    return r.body && r.body.length > 0 && /json|text|event-stream|application\/json|api|chat|complete|generate/i.test(r.url + r.mimeType);
  });

  if (interesting.length === 0) {
    console.log('(no JSON/text responses found; listing recent responses)');
    for (const r of responses.slice(-10)) {
      console.log(`${r.url}  [${r.status}]  mime=${r.mimeType}  body=${r.body ? r.body.toString().slice(0,200) : '<no body>'}`);
    }
  } else {
    for (const r of interesting.slice(-10)) {
      console.log('URL:', r.url);
      console.log('status:', r.status, 'mime:', r.mimeType);
      console.log('body snippet:', typeof r.body === 'string' ? r.body.slice(0,1000) : '<binary>');
      console.log('---');
    }
  }

  // WebSocket frames
  if (wsFrames.length) {
    console.log('\n--- WebSocket frames captured ---');
    // group frames by requestId
    const byReq = {};
    for (const f of wsFrames) {
      byReq[f.requestId] = byReq[f.requestId] || [];
      byReq[f.requestId].push(f);
    }
    for (const reqId of Object.keys(byReq)) {
      console.log('WS requestId:', reqId, 'frames:', byReq[reqId].length);
      const joined = byReq[reqId].map(x => x.payload).join('');
      const snippet = joined.length > 1500 ? joined.slice(0,1500) + '...[truncated]' : joined;
      console.log(snippet);
      console.log('---');
    }
  } else {
    console.log('\n(no WebSocket frames captured)');
  }

  // Choose a "final response" heuristic: last interesting response, or last WS payload
  let final = null;
  if (interesting.length) {
    final = interesting[interesting.length - 1];
    console.log('\n=== Final HTTP response candidate ===');
    console.log('URL:', final.url);
    console.log('Body (up to 4000 chars):\n', final.body ? final.body.toString().slice(0,4000) : '<no body>');
  } else if (wsFrames.length) {
    const allWs = wsFrames.map(f => f.payload).join('');
    console.log('\n=== Final WebSocket aggregated payload ===\n', allWs.slice(0,4000));
  } else {
    console.log('\nNo clear model response found in captured network traffic within window. Try increasing captureWindowMs or updating selectors for message send.');
  }

  console.log('\nCaptured Request URLs (recent):');
  for (const r of requests.slice(-20)) {
    console.log('-', r.method, r.url);
  }

  // Keep browser open so user can inspect DevTools if they want (or close)
  console.log('\nDone. Browser remains open for manual inspection. Close it to exit the script.');
  // Optionally keep running until user closes.
}

const u = process.argv[2];
run(u).catch(err => { console.error(err); process.exit(1); });