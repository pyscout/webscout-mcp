/**
 * Utility class for network monitoring and data capture
 */
export class NetworkUtilities {
  /**
   * Check if a response body contains streaming patterns
   * @param {string} body - Response body to check
   * @returns {boolean} Whether the body contains streaming patterns
   */
  static isStreamingResponse(body) {
    if (!body || typeof body !== "string") return false;

    return (
      body.includes("data: ") ||
      body.includes("data:{") ||
      body.includes("data:[") ||
      /event:\s*data/i.test(body) ||
      /delta:\s*"/i.test(body) ||
      /content:\s*"/i.test(body) ||
      /chunk/i.test(body) ||
      /token/i.test(body) ||
      /progress/i.test(body) ||
      /finish_reason/i.test(body) ||
      body.includes("f:{") ||
      body.includes('0:"') ||
      body.includes("e:{") ||
      body.includes("d:{") ||
      body.includes('"messageId":') ||
      /^f:\{/m.test(body) ||
      /^0:"/m.test(body) ||
      /^e:\{/m.test(body) ||
      /^d:\{/m.test(body)
    );
  }

  /**
   * Check if content type or headers indicate streaming
   * @param {Object} headers - Response headers
   * @returns {boolean} Whether headers indicate streaming
   */
  static isStreamingHeaders(headers) {
    const contentType = headers["content-type"] || "";
    const transferEncoding = headers["transfer-encoding"] || "";

    return (
      contentType.includes("event-stream") ||
      contentType.includes("stream") ||
      transferEncoding.includes("chunked")
    );
  }

  /**
   * Parse data that could be JSON or plain text
   * @param {string} data - Data to parse
   * @returns {Object|string} Parsed data or original string
   */
  static parseData(data) {
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  /**
   * Check if WebSocket payload contains streaming patterns
   * @param {string} payload - WebSocket payload
   * @returns {boolean} Whether payload contains streaming patterns
   */
  static isStreamingWebSocketPayload(payload) {
    if (!payload || typeof payload !== "string") return false;

    return (
      payload.includes("data:") ||
      payload.includes("content:") ||
      payload.includes("delta:") ||
      /chunk|stream|token|progress/i.test(payload) ||
      /^f:\{/m.test(payload) ||
      /^0:"/m.test(payload) ||
      /^e:\{/m.test(payload) ||
      /^d:\{/m.test(payload) ||
      /"messageId":/i.test(payload)
    );
  }

  /**
   * Check if WebSocket payload contains message-like data
   * @param {string} payload - WebSocket payload
   * @returns {boolean} Whether payload contains message data
   */
  static isMessagePayload(payload) {
    if (!payload || typeof payload !== "string") return false;

    return (
      payload.includes('"message"') ||
      payload.includes('"prompt"') ||
      payload.includes('"query"') ||
      payload.includes('"input"')
    );
  }

  /**
   * Format output data - keep SSE format as-is, parse JSON if possible
   * @param {string} data - Data to format
   * @returns {Object|string} Formatted data
   */
  static formatOutput(data) {
    if (!data) return null;

    // Keep SSE format as-is
    if (
      typeof data === "string" &&
      (data.trim().startsWith("data:") || data.includes("\ndata:"))
    ) {
      return data;
    }

    // Try to parse as JSON
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  /**
   * Format input data for output
   * @param {string|Object} data - Data to format
   * @returns {string} Formatted string
   */
  static formatInput(data) {
    if (!data) return null;
    return typeof data === "object" ? JSON.stringify(data) : data;
  }
}
