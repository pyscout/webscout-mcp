import { getSession } from "./sessionManagement.js";

/**
 * Click an element on the page
 * @param {string} sessionId - Session ID
 * @param {string} selector - CSS selector (optional if text is provided)
 * @param {string} text - Text content to find and click (optional if selector is provided)
 * @param {number} waitAfter - Milliseconds to wait after clicking
 * @returns {Promise<Object>} Click result
 */
export async function clickElement(
  sessionId,
  selector = null,
  text = null,
  waitAfter = 1000
) {
  const session = getSession(sessionId);
  const { page } = session;

  try {
    if (selector) {
      await page.click(selector);
    } else if (text) {
      // Try to find element by text content
      const clickedByText = await page.evaluate((searchText) => {
        const elements = Array.from(
          document.querySelectorAll('button, a, [role="button"], [onclick]')
        );
        const target = elements.find((el) =>
          el.textContent.trim().toLowerCase().includes(searchText.toLowerCase())
        );
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, text);

      if (!clickedByText) {
        // Try using Playwright's text selector
        await page.click(`text=${text}`);
      }
    } else {
      throw new Error("Either selector or text parameter is required");
    }

    await page.waitForTimeout(waitAfter);

    return {
      success: true,
      sessionId,
      currentUrl: page.url(),
      title: await page.title(),
      message: `Clicked element successfully`,
    };
  } catch (error) {
    throw new Error(`Failed to click element: ${error.message}`);
  }
}

/**
 * Fill out form fields
 * @param {string} sessionId - Session ID
 * @param {Array} fields - Array of {selector, value, pressEnter} objects
 * @param {string} submitButton - Optional submit button selector
 * @returns {Promise<Object>} Fill result
 */
export async function fillForm(sessionId, fields, submitButton = null) {
  const session = getSession(sessionId);
  const { page } = session;

  try {
    for (const field of fields) {
      const { selector, value, pressEnter = false } = field;

      await page.waitForSelector(selector, { timeout: 5000 });
      await page.fill(selector, value);

      if (pressEnter) {
        await page.press(selector, "Enter");
        await page.waitForTimeout(1000);
      }
    }

    if (submitButton) {
      await page.click(submitButton);
      await page.waitForTimeout(2000);
    }

    return {
      success: true,
      sessionId,
      currentUrl: page.url(),
      title: await page.title(),
      message: `Filled ${fields.length} field(s) successfully`,
    };
  } catch (error) {
    throw new Error(`Failed to fill form: ${error.message}`);
  }
}

/**
 * Wait for an element to appear
 * @param {string} sessionId - Session ID
 * @param {string} selector - CSS selector to wait for
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<Object>} Wait result
 */
export async function waitForElement(sessionId, selector, timeout = 30000) {
  const session = getSession(sessionId);
  const { page } = session;

  try {
    await page.waitForSelector(selector, { timeout });

    return {
      success: true,
      sessionId,
      selector,
      message: `Element "${selector}" found`,
      currentUrl: page.url(),
    };
  } catch (error) {
    throw new Error(`Element "${selector}" not found within ${timeout}ms`);
  }
}
