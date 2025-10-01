import { getSession } from "./sessionManagement.js";

/**
 * Take a screenshot of the current page
 * @param {string} sessionId - Session ID
 * @param {boolean} fullPage - Whether to capture full scrollable page
 * @param {string} selector - Optional selector to screenshot specific element
 * @returns {Promise<Object>} Screenshot information
 */
export async function takeScreenshot(
  sessionId,
  fullPage = false,
  selector = null
) {
  const session = getSession(sessionId);
  const { page } = session;

  let screenshotBuffer;
  if (selector) {
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }
    screenshotBuffer = await element.screenshot();
  } else {
    screenshotBuffer = await page.screenshot({ fullPage });
  }

  const base64Image = screenshotBuffer.toString("base64");

  return {
    success: true,
    sessionId,
    currentUrl: page.url(),
    title: await page.title(),
    screenshotBase64: base64Image,
    screenshotDataUrl: `data:image/png;base64,${base64Image}`,
    message: "Screenshot captured successfully",
  };
}

/**
 * Get current page information
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Page information
 */
export async function getCurrentPageInfo(sessionId) {
  const session = getSession(sessionId);
  const { page, context, createdAt } = session;
  const pages = context.pages();

  const pageInfo = {
    success: true,
    sessionId,
    currentUrl: page.url(),
    title: await page.title(),
    totalTabs: pages.length,
    currentTabIndex: pages.indexOf(page),
    sessionCreatedAt: createdAt,
    allTabs: await Promise.all(
      pages.map(async (p, idx) => ({
        index: idx,
        url: p.url(),
        title: await p.title(),
        isCurrent: p === page,
      }))
    ),
  };

  return pageInfo;
}
