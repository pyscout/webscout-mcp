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
  await client.send('Fetch.enable');

  // Storage for captured items
  const requests = []; // {requestId, url, method, timestamp, postData}
  const responses = []; // {requestId, url, status, mimeType, body, isStreaming, isComplete}
  const wsFrames = []; // {requestId, timestamp, opcode, payload}
  const streamingResponses = []; // {requestId, url, method, postData, responseData, isComplete}

  // Network.requestWillBeSent - only capture POST requests
  client.on('Network.requestWillBeSent', (params) => {
    try {
      const { requestId, request, timestamp } = params;
      // Only capture POST requests for streaming analysis
      if (request.method === 'POST') {
        const postData = request.postData;
        requests.push({ requestId, url: request.url, method: request.method, timestamp, postData, headers: request.headers });
      }
    } catch (e) { /* ignore */ }
  });

  // Network.responseReceived -> attempt to get body (only for POST requests)
  client.on('Network.responseReceived', async (params) => {
    try {
      const { requestId, response } = params;
      
      // Only process responses for POST requests we captured
      const matchingRequest = requests.find(r => r.requestId === requestId);
      if (!matchingRequest) return;
      
      const url = response.url;
      const mimeType = response.mimeType || '';
      const status = response.status;
      const headers = response.headers || {};
      
      // Check if this is a streaming response
      const isStreaming = 
        mimeType.includes('event-stream') || 
        headers['content-type']?.includes('event-stream') ||
        headers['transfer-encoding']?.includes('chunked');
      
      let body = null;
      let isComplete = true;
      let hasStreamingPackets = false;
      
      // Store response info without body for now
      responses.push({ requestId, url, status, mimeType, body: null, isStreaming, isComplete, hasStreamingPackets });
      
      // Mark as streaming based on headers/mime type for now
      if (isStreaming) {
        streamingResponses.push({
          requestId,
          url,
          method: matchingRequest.method,
          postData: matchingRequest.postData,
          headers: matchingRequest.headers,
          responseHeaders: headers,
          isComplete: false,
          hasStreamingPackets: true,
          body: null
        });
      }
      
      responses.push({ requestId, url, status, mimeType, body, isStreaming, isComplete, hasStreamingPackets });
      
      // If it appears to be streaming or has streaming packets, track it
      if (isStreaming || hasStreamingPackets) {
        streamingResponses.push({
          requestId,
          url,
          method: matchingRequest.method,
          postData: matchingRequest.postData,
          headers: matchingRequest.headers,
          responseHeaders: headers,
          isComplete,
          hasStreamingPackets,
          body: body
        });
      }
    } catch (e) { /* ignore */ }
  });

  // Network.loadingFinished -> get final response body when loading is complete
  client.on('Network.loadingFinished', async (params) => {
    try {
      const { requestId } = params;
      
      // Find the corresponding response and request
      const response = responses.find(r => r.requestId === requestId);
      const request = requests.find(r => r.requestId === requestId);
      
      if (!response || !request) return; // Only process POST requests we're tracking
      
      // Try to get the response body now that loading is finished
      try {
        const rb = await client.send('Network.getResponseBody', { requestId });
        let body = rb && rb.body ? rb.body : null;
        
        // Handle base64 encoded responses
        if (rb && rb.base64Encoded && body) {
          body = Buffer.from(body, 'base64').toString('utf-8');
        }
        
        // Update the response with the body
        response.body = body;
        response.isComplete = true;
        
        // Check for streaming patterns in the response body
        if (body && typeof body === 'string') {
          const hasStreamingPackets = 
            body.includes('data: ') || 
            body.includes('data:{') || 
            body.includes('data:[') ||
            /event:\s*data/i.test(body) ||
            /delta:\s*"/i.test(body) ||
            /content:\s*"/i.test(body) ||
            /chunk/i.test(body) ||
            /token/i.test(body) ||
            /progress/i.test(body) ||
            /finish_reason/i.test(body) ||
            // New streaming format patterns
            body.includes('f:{') ||  // Frame/start messages
            body.includes('0:"') ||   // Content chunks
            body.includes('e:{') ||  // End messages with finishReason
            body.includes('d:{') ||  // Duplicate end messages
            body.includes('"messageId":') || // Message ID indicators
            /^f:\{/m.test(body) ||  // Frame/start messages (regex)
            /^0:"/m.test(body) ||   // Content chunks (regex)
            /^e:\{/m.test(body) ||  // End messages with finishReason (regex)
            /^d:\{/m.test(body);    // Duplicate end messages (regex)
            
          response.hasStreamingPackets = hasStreamingPackets;
          
          // If we detected streaming patterns, add to streamingResponses if not already there
          if (hasStreamingPackets) {
            const existingStreaming = streamingResponses.find(sr => sr.requestId === requestId);
            if (!existingStreaming) {
              streamingResponses.push({
                requestId,
                url: response.url,
                method: request.method,
                postData: request.postData,
                headers: request.headers,
                responseHeaders: response.headers || {},
                isComplete: true,
                hasStreamingPackets: true,
                body: body
              });
            } else {
              // Update existing entry with complete body
              existingStreaming.body = body;
              existingStreaming.isComplete = true;
            }
          }
        }
      } catch (err) {
        // Still couldn't get body - mark as error
        response.body = `<<could not get response body: ${err.message}>>`;
        response.isComplete = false;
      }
    } catch (e) { /* ignore */ }
  });

  // Network.dataReceived -> capture streaming data as it arrives
  client.on('Network.dataReceived', async (params) => {
    try {
      const { requestId, dataLength, encodedDataLength } = params;
      
      // Find if this is a POST request we're tracking
      const request = requests.find(r => r.requestId === requestId);
      if (!request) return;
      
      // If we're receiving data chunks, it's likely streaming
      const response = responses.find(r => r.requestId === requestId);
      if (response) {
        response.hasStreamingPackets = true;
        
        // Add to streaming responses if not already there
        const existingStreaming = streamingResponses.find(sr => sr.requestId === requestId);
        if (!existingStreaming) {
          streamingResponses.push({
            requestId,
            url: response.url,
            method: request.method,
            postData: request.postData,
            headers: request.headers,
            responseHeaders: response.headers || {},
            isComplete: false,
            hasStreamingPackets: true,
            body: `<<streaming data detected: ${dataLength} bytes received>>`
          });
        }
      }
    } catch (e) { /* ignore */ }
  });

  // Capture WebSocket frames (if the site uses websockets for streaming)
  client.on('Network.webSocketFrameReceived', (params) => {
    try {
      const { requestId, timestamp, response } = params;
      wsFrames.push({ requestId, timestamp, opcode: response.opcode, payload: response.payloadData });
      
      // If the payload includes streaming patterns
      if (response.payloadData && typeof response.payloadData === 'string') {
        const payloadStr = response.payloadData;
        if (payloadStr.includes('data:') || 
            payloadStr.includes('content:') || 
            payloadStr.includes('delta:') || 
            /chunk|stream|token|progress/i.test(payloadStr) ||
            // New streaming format patterns
            /^f:\{/m.test(payloadStr) ||
            /^0:"/m.test(payloadStr) ||
            /^e:\{/m.test(payloadStr) ||
            /^d:\{/m.test(payloadStr) ||
            /"messageId":/i.test(payloadStr)) {
          // Check if this WebSocket is related to a POST request we captured
          const matchingRequest = requests.find(r => r.requestId === requestId);
          if (matchingRequest && !streamingResponses.some(sr => sr.requestId === requestId)) {
            streamingResponses.push({
              requestId,
              url: 'websocket-connection',
              method: 'WS',
              postData: null, // WebSocket doesn't have traditional POST data
              isWebsocket: true,
              samplePayload: payloadStr.substring(0, 200),
              hasStreamingPackets: true,
              isComplete: false // WebSocket streams are ongoing
            });
          }
        }
      }
    } catch (e) { /* ignore */ }
  });
  
  client.on('Network.webSocketFrameSent', (params) => {
    try {
      // Capture outgoing frames to find input messages
      const { requestId, timestamp, response } = params;
      const payload = response && response.payloadData;
      if (payload && typeof payload === 'string') {
        // If it looks like a chat message/prompt being sent
        if (payload.includes('"message"') || 
            payload.includes('"prompt"') || 
            payload.includes('"query"') || 
            payload.includes('"input"')) {
          // Update any existing streaming response for this WebSocket
          const streamingResponse = streamingResponses.find(sr => sr.requestId === requestId);
          if (streamingResponse) {
            streamingResponse.postData = payload;
          }
        }
      }
    } catch (e) { /* ignore */ }
  });
  
  // Add Fetch API handling for better streaming detection (only for POST requests)
  client.on('Fetch.requestPaused', async (params) => {
    const { requestId, request, responseStatusCode, responseHeaders } = params;
    try {
      // Only process POST requests
      if (request.method !== 'POST') {
        await client.send('Fetch.continueRequest', { requestId });
        return;
      }
      
      // Continue the request normally
      await client.send('Fetch.continueRequest', { requestId });
      
      // Check if this is likely a streaming response
      if (responseHeaders) {
        const contentType = responseHeaders.find(h => h.name.toLowerCase() === 'content-type')?.value || '';
        const transferEncoding = responseHeaders.find(h => h.name.toLowerCase() === 'transfer-encoding')?.value || '';
        
        if (contentType.includes('event-stream') || transferEncoding.includes('chunked')) {
          const matchingRequest = requests.find(r => r.url === request.url && r.method === 'POST');
          if (matchingRequest && !streamingResponses.some(sr => sr.url === request.url)) {
            streamingResponses.push({
              requestId,
              url: request.url,
              method: request.method,
              postData: request.postData,
              headers: request.headers,
              isFetchStream: true,
              hasStreamingPackets: true,
              isComplete: false // Fetch streams may be ongoing
            });
          }
        }
      }
    } catch (e) { /* ignore - continue request already sent by other handler */ }
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

  // Post-processing: focus only on POST requests with streaming responses
  // All analysis is done in the final output section below

  // Post-processing: show all POST request responses
  console.log('\n=== ALL POST REQUEST RESPONSES ===');

  // Get all POST responses
  const postResponses = responses.filter(r => {
    const matchingRequest = requests.find(req => req.requestId === r.requestId);
    return matchingRequest && matchingRequest.method === 'POST';
  });

  if (postResponses.length > 0) {
    console.log(`Found ${postResponses.length} POST request responses:`);

    postResponses.forEach((r, index) => {
      const matchingRequest = requests.find(req => req.requestId === r.requestId);
      const isStreamingResponse = r.isStreaming || r.hasStreamingPackets ||
        (r.body && typeof r.body === 'string' && (
          r.body.includes('data: ') ||
          r.body.includes('data:{') ||
          r.body.includes('data:[') ||
          /event:\s*data/i.test(r.body) ||
          /delta:\s*"/i.test(r.body) ||
          /content:\s*"/i.test(r.body) ||
          /chunk/i.test(r.body) ||
          /token/i.test(r.body) ||
          /progress/i.test(r.body) ||
          /finish_reason/i.test(r.body) ||
          // New streaming format patterns
          /^f:\{/m.test(r.body) ||
          /^0:"/m.test(r.body) ||
          /^e:\{/m.test(r.body) ||
          /^d:\{/m.test(r.body) ||
          /"messageId":/i.test(r.body)
        ));

      console.log(`\n[${index + 1}] POST REQUEST RESPONSE:`);
      console.log(`URL: ${r.url}`);
      console.log(`Status: ${r.status}`);
      console.log(`MIME Type: ${r.mimeType}`);
      console.log(`Response Complete: ${r.isComplete ? 'YES' : 'NO'}`);
      console.log(`Is Streaming: ${isStreamingResponse ? 'YES' : 'NO'}`);

      // Display request input/payload
      if (matchingRequest && matchingRequest.postData) {
        console.log('\nREQUEST INPUT:');
        try {
          // Try to parse and pretty-print JSON
          const jsonData = JSON.parse(matchingRequest.postData);
          console.log(JSON.stringify(jsonData, null, 2));
        } catch {
          // If not valid JSON, show as-is
          console.log(matchingRequest.postData.slice(0, 2000) + (matchingRequest.postData.length > 2000 ? '...[truncated]' : ''));
        }
      }

      // Show response body
      if (r.body) {
        console.log('\nRESPONSE BODY:');
        if (typeof r.body === 'string') {
          // For streaming responses, show more content
          const maxLength = isStreamingResponse ? 5000 : 2000;
          console.log(r.body.slice(0, maxLength) + (r.body.length > maxLength ? '...[truncated]' : ''));
        } else {
          console.log('<binary data>');
        }
      } else {
        console.log('\nRESPONSE BODY: <no body captured>');
      }

      // Show relevant headers
      if (r.headers && Object.keys(r.headers).length > 0) {
        const relevantHeaders = ['content-type', 'transfer-encoding', 'connection', 'content-length'];
        const filteredHeaders = Object.entries(r.headers)
          .filter(([key]) => relevantHeaders.includes(key.toLowerCase()))
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        if (filteredHeaders) {
          console.log('\nRELEVANT RESPONSE HEADERS:');
          console.log(filteredHeaders);
        }
      }

      console.log('----------------------------------------');
    });
  } else {
    console.log('No POST responses captured.');
  }

  // Also show streaming summary if any were found
  const streamingPostResponses = postResponses.filter(r => {
    const isStreamingResponse = r.isStreaming || r.hasStreamingPackets ||
      (r.body && typeof r.body === 'string' && (
        r.body.includes('data: ') ||
        r.body.includes('data:{') ||
        r.body.includes('data:[') ||
        /event:\s*data/i.test(r.body) ||
        /delta:\s*"/i.test(r.body) ||
        /content:\s*"/i.test(r.body) ||
        /chunk/i.test(r.body) ||
        /token/i.test(r.body) ||
        /progress/i.test(r.body) ||
        /finish_reason/i.test(r.body) ||
        // New streaming format patterns
        /^f:\{/m.test(r.body) ||
        /^0:"/m.test(r.body) ||
        /^e:\{/m.test(r.body) ||
        /^d:\{/m.test(r.body) ||
        /"messageId":/i.test(r.body)
      ));
    return isStreamingResponse;
  });

  if (streamingPostResponses.length > 0) {
    console.log('\n=== STREAMING POST REQUESTS SUMMARY ===');
    streamingPostResponses.forEach((sr, index) => {
      const matchingRequest = requests.find(req => req.requestId === sr.requestId);
      console.log(`[${index + 1}] ${sr.url} [${sr.isComplete ? 'COMPLETE' : 'STREAMING'}]`);
      if (matchingRequest && matchingRequest.postData) {
        try {
          const json = JSON.parse(matchingRequest.postData);
          const input = json.prompt || json.message || json.messages || json.input || json.query;
          if (input) {
            console.log(`    Input: ${JSON.stringify(input).slice(0, 100)}...`);
          } else {
            console.log(`    Raw input: ${matchingRequest.postData.slice(0, 100)}...`);
          }
        } catch {
          console.log(`    Raw input: ${matchingRequest.postData.slice(0, 100)}...`);
        }
      }
    });
  }

  console.log('\n=== SUMMARY: POST REQUESTS WITH STREAMING ===');
  if (streamingResponses.length > 0) {
    streamingResponses.forEach((sr, index) => {
      const status = sr.isComplete ? 'COMPLETE' : 'STREAMING';
      console.log(`[${index + 1}] ${sr.method} ${sr.url} [${status}]`);
      if (sr.postData) {
        try {
          const json = JSON.parse(sr.postData);
          const input = json.prompt || json.message || json.messages || json.input || json.query;
          if (input) {
            console.log(`    Input: ${JSON.stringify(input).slice(0, 100)}...`);
          } else {
            console.log(`    Raw input: ${sr.postData.slice(0, 100)}...`);
          }
        } catch {
          console.log(`    Raw input: ${sr.postData.slice(0, 100)}...`);
        }
      }
    });
  } else {
    console.log('No POST requests with streaming responses found.');
  }

  console.log('\nCaptured POST Request URLs:');
  for (const r of requests.slice(-10)) {
    console.log('-', r.method, r.url);
  }

  // Keep browser open so user can inspect DevTools if they want (or close)
  console.log('\nDone. Browser remains open for manual inspection. Close it to exit the script.');
  // Optionally keep running until user closes.
}

const u = process.argv[2];
run(u).catch(err => { console.error(err); process.exit(1); });