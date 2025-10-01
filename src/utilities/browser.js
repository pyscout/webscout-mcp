import { chromium } from "playwright";

/**
 * Utility class for browser automation and message sending
 */
export class BrowserUtilities {
  /**
   * Send a message to a chat interface by trying various common selectors
   * @param {Page} page - Playwright page object
   * @param {string} message - Message to send
   */
  static async sendMessage(page, message) {
    const selectors = [
      "textarea",
      'input[type="text"]',
      '[contenteditable="true"]',
      'div[role="textbox"]',
      ".chat-input textarea",
      ".composer textarea",
      'input[name="message"]',
      ".message-input",
      "form textarea",
    ];

    for (const sel of selectors) {
      const el = await page.$(sel);
      if (!el) continue;
      try {
        await el.focus();
        await page.keyboard.type(message);
        await page.keyboard.press("Enter");
        return;
      } catch (e) {
        // ignore and try next
      }
    }

    // Try clicking send button
    const textarea =
      (await page.$("textarea")) || (await page.$('[contenteditable="true"]'));
    if (textarea) {
      try {
        await textarea.focus();
        await page.keyboard.type(message);
        const sendButtons = await page.$$("button");
        for (const b of sendButtons) {
          const txt = (await b.innerText()).toLowerCase();
          if (
            txt.includes("send") ||
            txt.includes("submit") ||
            txt.includes("reply")
          ) {
            await b.click();
            return;
          }
        }
        await page.keyboard.press("Enter");
        return;
      } catch (e) {
        // ignore
      }
    }

    // Last resort
    try {
      await page.mouse.click(600, 700);
      await page.keyboard.type(message);
      await page.keyboard.press("Enter");
    } catch (e) {
      // ignore
    }
  }

  /**
   * Launch a browser instance with standard configuration
   * @param {boolean} headless - Whether to run in headless mode (default: true)
   * @returns {Promise<Browser>} Browser instance
   */
  static async launchBrowser(headless = true) {
    return await chromium.launch({
      headless: headless,
      args: [],
    });
  }
}
