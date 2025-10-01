import { BrowserUtilities } from "../utilities/browser.js";

// Session management storage
const activeSessions = new Map();

/**
 * Generate a unique session ID
 * @returns {string} Unique session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Initialize a new interactive browser session
 * @param {string} url - Initial URL to navigate to
 * @param {boolean} headless - Whether to run in headless mode
 * @returns {Promise<Object>} Session information
 */
export async function initializeSession(url, headless = true) {
  const sessionId = generateSessionId();

  const browser = await BrowserUtilities.launchBrowser(headless);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "load", timeout: 30000 });

  activeSessions.set(sessionId, {
    browser,
    context,
    page,
    createdAt: new Date().toISOString(),
    currentUrl: url,
  });

  return {
    sessionId,
    success: true,
    currentUrl: page.url(),
    title: await page.title(),
    message: "Session initialized successfully",
  };
}

/**
 * Close a session and clean up resources
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Close result
 */
export async function closeSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const { browser } = session;
  await browser.close();
  activeSessions.delete(sessionId);

  return {
    success: true,
    sessionId,
    message: "Session closed successfully",
  };
}

/**
 * Get an active session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object} Session object
 * @throws {Error} If session not found
 */
export function getSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  return session;
}
