import { getSession } from "./sessionManagement.js";

/**
 * Navigate to a new URL
 * @param {string} sessionId - Session ID
 * @param {string} url - URL to navigate to
 * @param {string} waitUntil - Wait until event
 * @returns {Promise<Object>} Navigation result
 */
export async function navigateToUrl(sessionId, url, waitUntil = "load") {
  const session = getSession(sessionId);
  const { page } = session;

  try {
    await page.goto(url, { waitUntil, timeout: 30000 });
    session.currentUrl = url;

    return {
      success: true,
      sessionId,
      currentUrl: page.url(),
      title: await page.title(),
      message: "Navigation successful",
    };
  } catch (error) {
    throw new Error(`Failed to navigate: ${error.message}`);
  }
}

/**
 * Switch to a different tab/page
 * @param {string} sessionId - Session ID
 * @param {number} tabIndex - Zero-based index of tab to switch to
 * @returns {Promise<Object>} Switch result
 */
export async function switchTab(sessionId, tabIndex) {
  const session = getSession(sessionId);
  const { context } = session;
  const pages = context.pages();

  if (tabIndex < 0 || tabIndex >= pages.length) {
    throw new Error(
      `Tab index ${tabIndex} out of range. Available tabs: 0-${
        pages.length - 1
      }`
    );
  }

  const newPage = pages[tabIndex];
  session.page = newPage;

  return {
    success: true,
    sessionId,
    currentTabIndex: tabIndex,
    totalTabs: pages.length,
    currentUrl: newPage.url(),
    title: await newPage.title(),
    message: `Switched to tab ${tabIndex}`,
  };
}
