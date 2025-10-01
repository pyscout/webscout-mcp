import { BrowserUtilities } from "../utilities/browser.js";
import { NetworkUtilities } from "../utilities/network.js";

/**
 * Reverse engineer a chat interface to find streaming endpoints
 * @param {string} targetUrl - URL of the chat interface
 * @param {string} message - Message to send
 * @param {number} captureWindowMs - Time to capture network traffic
 * @returns {Promise<Array>} Array of captured requests/responses
 */
export async function reverseEngineerChat(targetUrl, message, captureWindowMs) {
  const browser = await BrowserUtilities.launchBrowser();

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    // Storage for captured items
    const requests = [];
    const responses = [];
    const wsFrames = [];
    const streamingResponses = [];
    const streamingDataChunks = new Map();
    const routeCaptures = new Map();

    // Use Playwright's route interception to capture response bodies
    await page.route("**/*", async (route) => {
      const request = route.request();
      const response = await route.fetch();

      // Capture POST request data
      if (request.method() === "POST") {
        const postData = request.postData();
        const url = request.url();

        try {
          const buffer = await response.body();
          const text = buffer.toString("utf-8");

          const headers = response.headers();
          const isStreaming =
            NetworkUtilities.isStreamingHeaders(headers) ||
            text.includes("data: ") ||
            text.includes("data:{") ||
            text.includes("\ndata:");

          if (isStreaming || text.includes("data:")) {
            routeCaptures.set(url, {
              url,
              postData,
              responseBody: text,
              headers: request.headers(),
              responseHeaders: headers,
              isStreaming: true,
            });
          }
        } catch (e) {
          // Failed to get response body, that's okay
        }
      }

      await route.fulfill({ response });
    });

    // Create CDP session to capture low-level network events
    const client = await context.newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Fetch.enable");

    // Network.requestWillBeSent - only capture POST requests
    client.on("Network.requestWillBeSent", (params) => {
      try {
        const { requestId, request, timestamp } = params;
        if (request.method === "POST") {
          requests.push({
            requestId,
            url: request.url,
            method: request.method,
            timestamp,
            postData: request.postData,
            headers: request.headers,
          });
        }
      } catch (e) {
        /* ignore */
      }
    });

    // Network.responseReceived
    client.on("Network.responseReceived", async (params) => {
      try {
        const { requestId, response } = params;
        const matchingRequest = requests.find((r) => r.requestId === requestId);
        if (!matchingRequest) return;

        const url = response.url;
        const mimeType = response.mimeType || "";
        const status = response.status;
        const headers = response.headers || {};

        const isStreaming =
          mimeType.includes("event-stream") ||
          NetworkUtilities.isStreamingHeaders(headers);

        responses.push({
          requestId,
          url,
          status,
          mimeType,
          body: null,
          isStreaming,
          isComplete: false,
          hasStreamingPackets: false,
        });

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
            body: null,
          });
        }
      } catch (e) {
        /* ignore */
      }
    });

    // Network.loadingFinished
    client.on("Network.loadingFinished", async (params) => {
      try {
        const { requestId } = params;
        const response = responses.find((r) => r.requestId === requestId);
        const request = requests.find((r) => r.requestId === requestId);

        if (!response || !request) return;

        try {
          let body = null;

          if (streamingDataChunks.has(requestId)) {
            body = streamingDataChunks.get(requestId);
          } else {
            const rb = await client.send("Network.getResponseBody", {
              requestId,
            });
            body = rb && rb.body ? rb.body : null;

            if (rb && rb.base64Encoded && body) {
              body = Buffer.from(body, "base64").toString("utf-8");
            }
          }

          response.body = body;
          response.isComplete = true;

          if (body && typeof body === "string") {
            const hasStreamingPackets =
              NetworkUtilities.isStreamingResponse(body);
            response.hasStreamingPackets = hasStreamingPackets;

            if (hasStreamingPackets) {
              const existingStreaming = streamingResponses.find(
                (sr) => sr.requestId === requestId
              );
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
                  body: body,
                });
              } else {
                existingStreaming.body = body;
                existingStreaming.isComplete = true;
              }
            }
          }
        } catch (err) {
          if (streamingDataChunks.has(requestId)) {
            response.body = streamingDataChunks.get(requestId);
            response.isComplete = true;

            const existingStreaming = streamingResponses.find(
              (sr) => sr.requestId === requestId
            );
            if (existingStreaming) {
              existingStreaming.body = response.body;
              existingStreaming.isComplete = true;
            }
          } else {
            response.body = `<<could not get response body: ${err.message}>>`;
            response.isComplete = false;
          }
        }
      } catch (e) {
        /* ignore */
      }
    });

    // Network.dataReceived - Capture streaming data chunks
    client.on("Network.dataReceived", async (params) => {
      try {
        const { requestId } = params;
        const request = requests.find((r) => r.requestId === requestId);
        if (!request) return;

        try {
          const responseBody = await client.send("Network.getResponseBody", {
            requestId,
          });

          if (responseBody && responseBody.body) {
            let chunkData = responseBody.body;

            if (responseBody.base64Encoded) {
              chunkData = Buffer.from(chunkData, "base64").toString("utf-8");
            }

            streamingDataChunks.set(requestId, chunkData);
          }
        } catch (err) {
          // Network.getResponseBody might fail during streaming
        }

        const response = responses.find((r) => r.requestId === requestId);
        if (response) {
          response.hasStreamingPackets = true;

          const existingStreaming = streamingResponses.find(
            (sr) => sr.requestId === requestId
          );
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
              body: null,
            });
          }
        }
      } catch (e) {
        /* ignore */
      }
    });

    // WebSocket frame handling
    client.on("Network.webSocketFrameReceived", (params) => {
      try {
        const { requestId, timestamp, response } = params;
        wsFrames.push({
          requestId,
          timestamp,
          opcode: response.opcode,
          payload: response.payloadData,
        });

        if (response.payloadData && typeof response.payloadData === "string") {
          const payloadStr = response.payloadData;
          if (NetworkUtilities.isStreamingWebSocketPayload(payloadStr)) {
            const matchingRequest = requests.find(
              (r) => r.requestId === requestId
            );
            if (
              matchingRequest &&
              !streamingResponses.some((sr) => sr.requestId === requestId)
            ) {
              streamingResponses.push({
                requestId,
                url: "websocket-connection",
                method: "WS",
                postData: null,
                isWebsocket: true,
                samplePayload: payloadStr.substring(0, 200),
                hasStreamingPackets: true,
                isComplete: false,
              });
            }
          }
        }
      } catch (e) {
        /* ignore */
      }
    });

    client.on("Network.webSocketFrameSent", (params) => {
      try {
        const { requestId, response } = params;
        const payload = response && response.payloadData;
        if (payload && typeof payload === "string") {
          if (NetworkUtilities.isMessagePayload(payload)) {
            const streamingResponse = streamingResponses.find(
              (sr) => sr.requestId === requestId
            );
            if (streamingResponse) {
              streamingResponse.postData = payload;
            }
          }
        }
      } catch (e) {
        /* ignore */
      }
    });

    // Fetch API handling
    client.on("Fetch.requestPaused", async (params) => {
      const { requestId, request, responseHeaders } = params;
      try {
        if (request.method !== "POST") {
          await client.send("Fetch.continueRequest", { requestId });
          return;
        }

        await client.send("Fetch.continueRequest", { requestId });

        if (responseHeaders) {
          const contentType =
            responseHeaders.find((h) => h.name.toLowerCase() === "content-type")
              ?.value || "";
          const transferEncoding =
            responseHeaders.find(
              (h) => h.name.toLowerCase() === "transfer-encoding"
            )?.value || "";

          if (
            contentType.includes("event-stream") ||
            transferEncoding.includes("chunked")
          ) {
            const matchingRequest = requests.find(
              (r) => r.url === request.url && r.method === "POST"
            );
            if (
              matchingRequest &&
              !streamingResponses.some((sr) => sr.url === request.url)
            ) {
              streamingResponses.push({
                requestId,
                url: request.url,
                method: request.method,
                postData: request.postData,
                headers: request.headers,
                isFetchStream: true,
                hasStreamingPackets: true,
                isComplete: false,
              });
            }
          }
        }
      } catch (e) {
        /* ignore */
      }
    });

    // Navigate to the target URL
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Try to send the message
    await BrowserUtilities.sendMessage(page, message);

    // Capture network traffic for the specified window
    await page.waitForTimeout(captureWindowMs);

    // Process results
    const results = processResults(
      routeCaptures,
      streamingResponses,
      responses,
      requests
    );

    return results.length > 0
      ? results
      : [
          {
            url: null,
            input: null,
            output: "No streaming endpoints found",
          },
        ];
  } finally {
    await browser.close();
  }
}

/**
 * Process captured network data into results
 * @param {Map} routeCaptures - Data captured via route interception
 * @param {Array} streamingResponses - Streaming responses from CDP
 * @param {Array} responses - All responses
 * @param {Array} requests - All requests
 * @returns {Array} Processed results
 */
function processResults(
  routeCaptures,
  streamingResponses,
  responses,
  requests
) {
  const results = [];

  // First, add results from route captures (most reliable)
  for (const [url, capture] of routeCaptures) {
    const input = NetworkUtilities.parseData(capture.postData);
    const output = NetworkUtilities.formatOutput(capture.responseBody);

    results.push({
      url: capture.url,
      input: NetworkUtilities.formatInput(input),
      output: typeof output === "object" ? JSON.stringify(output) : output,
    });
  }

  // Process streaming responses from CDP
  for (const sr of streamingResponses) {
    if (routeCaptures.has(sr.url)) {
      continue;
    }

    const input = NetworkUtilities.parseData(sr.postData);
    const output = NetworkUtilities.formatOutput(sr.body);

    results.push({
      url: sr.url,
      input: NetworkUtilities.formatInput(input),
      output: typeof output === "object" ? JSON.stringify(output) : output,
    });
  }

  // Also check regular responses for streaming patterns
  const postResponses = responses.filter((r) => {
    const matchingRequest = requests.find(
      (req) => req.requestId === r.requestId
    );
    return matchingRequest && matchingRequest.method === "POST";
  });

  for (const r of postResponses) {
    const matchingRequest = requests.find(
      (req) => req.requestId === r.requestId
    );

    const isStreamingResponse =
      r.isStreaming ||
      r.hasStreamingPackets ||
      NetworkUtilities.isStreamingResponse(r.body);

    if (
      isStreamingResponse &&
      !results.some((result) => result.url === r.url)
    ) {
      const input = NetworkUtilities.parseData(matchingRequest?.postData);
      const output = NetworkUtilities.formatOutput(r.body);

      results.push({
        url: r.url,
        input: NetworkUtilities.formatInput(input),
        output: typeof output === "object" ? JSON.stringify(output) : output,
      });
    }
  }

  return results;
}
