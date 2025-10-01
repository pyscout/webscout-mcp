import { BrowserUtilities } from "../utilities/browser.js";
import { NetworkUtilities } from "../utilities/network.js";

/**
 * Network capture tool for monitoring HTTP requests and responses
 * Can capture all network traffic or filter by specific criteria
 */

/**
 * Start network capture session on a browser page
 * @param {string} sessionId - Session ID from initializeSession
 * @param {Object} options - Capture options
 * @param {boolean} options.capturePostOnly - Only capture POST requests (default: false)
 * @param {boolean} options.captureStreaming - Only capture streaming responses (default: false)
 * @param {Array<string>} options.urlFilters - Array of URL patterns to filter (default: [])
 * @param {number} options.maxCaptures - Maximum number of captures to store (default: 100)
 * @returns {Promise<Object>} Capture session info
 */
export async function startNetworkCapture(sessionId, options = {}) {
  const session = global.activeSessions?.get(sessionId);
  if (!session) {
    throw new Error(
      `Session ${sessionId} not found. Call initializeSession first.`
    );
  }

  const {
    capturePostOnly = false,
    captureStreaming = false,
    urlFilters = [],
    maxCaptures = 100,
  } = options;

  // Initialize capture storage
  const captureData = {
    sessionId,
    startTime: Date.now(),
    requests: [],
    responses: [],
    wsFrames: [],
    streamingResponses: [],
    options: { capturePostOnly, captureStreaming, urlFilters, maxCaptures },
  };

  // Store capture data in session
  session.networkCapture = captureData;

  // Set up CDP session for network monitoring
  const client = await session.context.newCDPSession(session.page);
  await client.send("Network.enable");
  await client.send("Fetch.enable", {
    patterns: [{ requestStage: "Response" }],
  });

  // Store client reference for cleanup
  captureData.cdpClient = client;

  // Network request capture
  client.on("Network.requestWillBeSent", (params) => {
    try {
      const { requestId, request, timestamp } = params;

      // Apply filters
      if (capturePostOnly && request.method !== "POST") return;
      if (
        urlFilters.length > 0 &&
        !urlFilters.some((pattern) => request.url.includes(pattern))
      )
        return;

      const requestData = {
        requestId,
        url: request.url,
        method: request.method,
        timestamp,
        headers: request.headers,
        postData: request.postData || null,
      };

      captureData.requests.push(requestData);

      // Limit storage
      if (captureData.requests.length > maxCaptures) {
        captureData.requests.shift();
      }
    } catch (e) {
      // Ignore capture errors
    }
  });

  // Network response capture
  client.on("Network.responseReceived", async (params) => {
    try {
      const { requestId, response } = params;
      const matchingRequest = captureData.requests.find(
        (r) => r.requestId === requestId
      );
      if (!matchingRequest) return;

      // Apply streaming filter if enabled
      if (captureStreaming) {
        const isStreaming =
          NetworkUtilities.isStreamingHeaders(response.headers) ||
          response.mimeType?.includes("stream") ||
          response.headers["transfer-encoding"] === "chunked";
        if (!isStreaming) return;
      }

      const responseData = {
        requestId,
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        mimeType: response.mimeType,
        timestamp: Date.now(),
      };

      // Try to capture response body for small responses
      if (
        response.headers["content-length"] &&
        parseInt(response.headers["content-length"]) < 10000
      ) {
        try {
          const body = await client.send("Network.getResponseBody", {
            requestId,
          });
          responseData.body = body.body;
          responseData.base64Encoded = body.base64Encoded;
        } catch (e) {
          // Body capture failed, continue without it
        }
      }

      captureData.responses.push(responseData);

      // Limit storage
      if (captureData.responses.length > maxCaptures) {
        captureData.responses.shift();
      }
    } catch (e) {
      // Ignore capture errors
    }
  });

  // WebSocket frame capture
  client.on("Network.webSocketFrameReceived", (params) => {
    try {
      const frameData = {
        timestamp: Date.now(),
        type: "received",
        opcode: params.response.opcode,
        payload: params.response.payloadData,
      };

      captureData.wsFrames.push(frameData);

      if (captureData.wsFrames.length > maxCaptures) {
        captureData.wsFrames.shift();
      }
    } catch (e) {
      // Ignore capture errors
    }
  });

  client.on("Network.webSocketFrameSent", (params) => {
    try {
      const frameData = {
        timestamp: Date.now(),
        type: "sent",
        opcode: params.response.opcode,
        payload: params.response.payloadData,
      };

      captureData.wsFrames.push(frameData);

      if (captureData.wsFrames.length > maxCaptures) {
        captureData.wsFrames.shift();
      }
    } catch (e) {
      // Ignore capture errors
    }
  });

  return {
    sessionId,
    captureId: `capture_${Date.now()}`,
    status: "active",
    options: captureData.options,
    message: "Network capture started successfully",
  };
}

/**
 * Stop network capture and return captured data
 * @param {string} sessionId - Session ID from initializeSession
 * @returns {Promise<Object>} Captured network data
 */
export async function stopNetworkCapture(sessionId) {
  const session = global.activeSessions?.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found.`);
  }

  const captureData = session.networkCapture;
  if (!captureData) {
    throw new Error(
      `No active network capture for session ${sessionId}. Call startNetworkCapture first.`
    );
  }

  // Clean up CDP session
  if (captureData.cdpClient) {
    try {
      await captureData.cdpClient.send("Network.disable");
      await captureData.cdpClient.send("Fetch.disable");
      await captureData.cdpClient.detach();
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Calculate capture duration
  const endTime = Date.now();
  const duration = endTime - captureData.startTime;

  // Prepare result
  const result = {
    sessionId,
    captureId: `capture_${captureData.startTime}`,
    duration,
    startTime: new Date(captureData.startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    summary: {
      totalRequests: captureData.requests.length,
      totalResponses: captureData.responses.length,
      totalWsFrames: captureData.wsFrames.length,
      streamingResponses: captureData.streamingResponses.length,
    },
    options: captureData.options,
    data: {
      requests: captureData.requests,
      responses: captureData.responses,
      wsFrames: captureData.wsFrames,
      streamingResponses: captureData.streamingResponses,
    },
  };

  // Clean up session data
  delete session.networkCapture;

  return result;
}

/**
 * Get current network capture status
 * @param {string} sessionId - Session ID from initializeSession
 * @returns {Promise<Object>} Current capture status
 */
export async function getNetworkCaptureStatus(sessionId) {
  const session = global.activeSessions?.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found.`);
  }

  const captureData = session.networkCapture;
  if (!captureData) {
    return {
      sessionId,
      status: "inactive",
      message: "No active network capture session",
    };
  }

  const duration = Date.now() - captureData.startTime;

  return {
    sessionId,
    status: "active",
    startTime: new Date(captureData.startTime).toISOString(),
    duration,
    currentStats: {
      requests: captureData.requests.length,
      responses: captureData.responses.length,
      wsFrames: captureData.wsFrames.length,
      streamingResponses: captureData.streamingResponses.length,
    },
    options: captureData.options,
  };
}

/**
 * Clear captured network data without stopping capture
 * @param {string} sessionId - Session ID from initializeSession
 * @returns {Promise<Object>} Status of clear operation
 */
export async function clearNetworkCapture(sessionId) {
  const session = global.activeSessions?.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found.`);
  }

  const captureData = session.networkCapture;
  if (!captureData) {
    throw new Error(`No active network capture for session ${sessionId}.`);
  }

  // Clear all data arrays but keep capture running
  captureData.requests = [];
  captureData.responses = [];
  captureData.wsFrames = [];
  captureData.streamingResponses = [];

  return {
    sessionId,
    status: "cleared",
    message: "Network capture data cleared, capture continues",
    options: captureData.options,
  };
}
