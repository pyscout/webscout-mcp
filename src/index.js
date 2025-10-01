#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import {
  reverseEngineerChat,
  takeScreenshot,
  clickElement,
  fillForm,
  switchTab,
  waitForElement,
  navigateToUrl,
  getCurrentPageInfo,
  initializeSession,
  closeSession,
  startNetworkCapture,
  stopNetworkCapture,
  getNetworkCaptureStatus,
  clearNetworkCapture,
} from "./tools/reverseEngineer.js";

class ReverseEngineerServer {
  constructor() {
    this.server = new Server(
      {
        name: "webscout-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "reverse_engineer_chat",
          description:
            "Automatically reverse engineer a chat interface by navigating to the URL, sending a test message, and capturing all network traffic to identify streaming API endpoints. Returns discovered endpoints with their request/response patterns including Server-Sent Events (SSE), WebSocket connections, and chunked HTTP responses. Perfect for quick analysis of public chat interfaces without authentication.",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description:
                  "The complete URL of the chat interface to analyze (e.g., https://chat.example.com)",
              },
              message: {
                type: "string",
                description:
                  'The test message to send to trigger a streaming response from the chat AI (default: "hi")',
                default: "hi",
              },
              captureWindowMs: {
                type: "number",
                description:
                  "Duration in milliseconds to monitor network traffic after sending the message. Increase for slow-responding APIs (default: 8000)",
                default: 8000,
              },
            },
            required: ["url"],
          },
        },
        {
          name: "initialize_session",
          description:
            "Create a persistent browser session for step-by-step reverse engineering of complex chat interfaces. Use this when the chat requires login, multi-step navigation, or manual interaction before analysis. Returns a sessionId that must be used with all subsequent interactive tools. The session maintains cookies, authentication state, and can be used across multiple operations until explicitly closed.",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description:
                  "The initial URL to navigate to (e.g., login page or chat homepage)",
              },
              headless: {
                type: "boolean",
                description:
                  "Run browser in headless mode (true) or visible mode (false). Set false to watch the automation process (default: true)",
                default: true,
              },
            },
            required: ["url"],
          },
        },
        {
          name: "take_screenshot",
          description:
            "Capture a screenshot of the current browser page as a base64-encoded PNG image. Essential for visual feedback to understand what's displayed before deciding which buttons to click or forms to fill. Supports capturing the visible viewport, entire scrollable page, or specific elements. Returns the image as base64 string and data URL for easy display.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
              fullPage: {
                type: "boolean",
                description:
                  "Capture the entire scrollable page content (true) or just visible viewport (false). Use true for long pages (default: false)",
                default: false,
              },
              selector: {
                type: "string",
                description:
                  "Optional CSS selector to capture only a specific element (e.g., '.chat-container', '#main-content')",
              },
            },
            required: ["sessionId"],
          },
        },
        {
          name: "click_element",
          description:
            "Click a button, link, or any interactive element on the page. Useful for navigating through multi-step interfaces, opening chat modals, starting new conversations, or triggering UI actions. Can target elements by CSS selector or by their visible text content. Automatically waits after clicking to allow page updates.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
              selector: {
                type: "string",
                description:
                  "CSS selector for the element to click (e.g., 'button#start-chat', '.new-conversation-btn'). Use this when you know the exact selector.",
              },
              text: {
                type: "string",
                description:
                  "Alternative to selector: visible text content to search for and click (e.g., 'Start Chat', 'Sign In', 'New Conversation'). Use this when selector is unknown.",
              },
              waitAfter: {
                type: "number",
                description:
                  "Milliseconds to wait after clicking to allow animations, redirects, or dynamic content to load (default: 1000)",
                default: 1000,
              },
            },
            required: ["sessionId"],
          },
        },
        {
          name: "fill_form",
          description:
            "Fill out one or multiple form fields in sequence, perfect for login forms, registration, search inputs, or any text entry. Supports pressing Enter after each field and clicking a submit button. Commonly used for authentication flows before accessing chat interfaces. Each field can be filled independently with optional Enter key press.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
              fields: {
                type: "array",
                description:
                  "Array of form field objects to fill in sequence. Each field requires a CSS selector and value. Example: [{selector: 'input[name=\"email\"]', value: 'user@example.com'}, {selector: 'input[type=\"password\"]', value: 'mypassword'}]",
                items: {
                  type: "object",
                  properties: {
                    selector: {
                      type: "string",
                      description:
                        "CSS selector for the input field (e.g., 'input[name=\"username\"]', '#email', '.search-box')",
                    },
                    value: {
                      type: "string",
                      description: "Text value to enter into the field",
                    },
                    pressEnter: {
                      type: "boolean",
                      description:
                        "Press Enter key after filling this field to submit or trigger search (default: false)",
                    },
                  },
                  required: ["selector", "value"],
                },
              },
              submitButton: {
                type: "string",
                description:
                  "Optional CSS selector for submit button to click after all fields are filled (e.g., 'button[type=\"submit\"]', '#login-button')",
              },
            },
            required: ["sessionId", "fields"],
          },
        },
        {
          name: "switch_tab",
          description:
            "Switch the active browser tab when multiple tabs are open in the session. Common scenario: clicking a link that opens a chat in a new tab requires switching to that tab to interact with it. Use get_current_page_info first to see all available tabs and their indices.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
              tabIndex: {
                type: "number",
                description:
                  "Zero-based index of the tab to switch to (0 = first tab, 1 = second tab, etc.). Use get_current_page_info to see available tabs.",
              },
            },
            required: ["sessionId", "tabIndex"],
          },
        },
        {
          name: "navigate_to_url",
          description:
            "Navigate to a different URL within the same browser session. Maintains all cookies, authentication state, and session data. Useful for moving between different sections of a website (e.g., from login page to chat page, or from homepage to a specific conversation URL). Supports different wait strategies for page load completion.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
              url: {
                type: "string",
                description:
                  "Complete URL to navigate to (e.g., 'https://chat.example.com/conversation/new')",
              },
              waitUntil: {
                type: "string",
                description:
                  "Page load strategy: 'load' (wait for load event), 'domcontentloaded' (wait for DOM ready), 'networkidle' (wait for network to be idle). Use 'networkidle' for SPAs (default: 'load')",
                default: "load",
              },
            },
            required: ["sessionId", "url"],
          },
        },
        {
          name: "wait_for_element",
          description:
            "Wait for a specific element to appear on the page before continuing. Essential for handling dynamic content that loads asynchronously, page transitions, or elements that appear after clicking buttons. Prevents errors from trying to interact with elements that haven't loaded yet. Commonly used after login, navigation, or clicking buttons that trigger loading states.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
              selector: {
                type: "string",
                description:
                  "CSS selector of the element to wait for (e.g., '.chat-container', '#message-input', '[data-loaded=\"true\"]')",
              },
              timeout: {
                type: "number",
                description:
                  "Maximum time in milliseconds to wait before timing out. Increase for slow-loading pages (default: 30000)",
                default: 30000,
              },
            },
            required: ["sessionId", "selector"],
          },
        },
        {
          name: "get_current_page_info",
          description:
            "Retrieve comprehensive information about the current browser state including current URL, page title, number of open tabs, and details about each tab. Essential for understanding where you are in a multi-step process, confirming navigation worked, or deciding which tab to switch to. Returns list of all tabs with their URLs, titles, and which one is currently active.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
            },
            required: ["sessionId"],
          },
        },
        {
          name: "close_session",
          description:
            "Close the browser session and free all associated resources including browser instance, pages, and contexts. Always call this when finished with a session to prevent memory leaks. The sessionId becomes invalid after closing and cannot be reused. Any unsaved work or open pages will be lost.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description:
                  "Session ID obtained from initialize_session to close",
              },
            },
            required: ["sessionId"],
          },
        },
        {
          name: "start_network_capture",
          description:
            "Start capturing network traffic on the current browser session. Monitors all HTTP requests and responses, WebSocket frames, and streaming data. Can filter by POST requests only, streaming responses only, or specific URL patterns. Essential for analyzing API calls, debugging network issues, or monitoring real-time data flows.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
              options: {
                type: "object",
                description: "Optional capture configuration",
                properties: {
                  capturePostOnly: {
                    type: "boolean",
                    description: "Only capture POST requests (default: false)",
                    default: false,
                  },
                  captureStreaming: {
                    type: "boolean",
                    description:
                      "Only capture streaming responses (default: false)",
                    default: false,
                  },
                  urlFilters: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "Array of URL patterns to filter captures (default: [])",
                    default: [],
                  },
                  maxCaptures: {
                    type: "number",
                    description:
                      "Maximum number of captures to store (default: 100)",
                    default: 100,
                  },
                },
              },
            },
            required: ["sessionId"],
          },
        },
        {
          name: "stop_network_capture",
          description:
            "Stop the active network capture session and return all captured data. Returns comprehensive network traffic including requests, responses, WebSocket frames, and streaming data with timestamps and headers. Use this to analyze captured network activity or save data for later processing.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
            },
            required: ["sessionId"],
          },
        },
        {
          name: "get_network_capture_status",
          description:
            "Get the current status of network capture for a session. Returns whether capture is active, duration, current statistics, and capture options. Useful for monitoring capture progress or checking if capture is running before stopping.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
            },
            required: ["sessionId"],
          },
        },
        {
          name: "clear_network_capture",
          description:
            "Clear all captured network data without stopping the capture session. Resets request/response buffers while keeping capture active. Useful for long-running captures where you want to periodically clear old data to prevent memory issues.",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Session ID obtained from initialize_session",
              },
            },
            required: ["sessionId"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments || {};

      try {
        let result;

        switch (toolName) {
          case "reverse_engineer_chat": {
            const { url, message = "hi", captureWindowMs = 8000 } = args;
            if (!url) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "URL parameter is required"
              );
            }
            result = await reverseEngineerChat(url, message, captureWindowMs);
            break;
          }

          case "initialize_session": {
            const { url, headless = true } = args;
            if (!url) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "URL parameter is required"
              );
            }
            result = await initializeSession(url, headless);
            break;
          }

          case "take_screenshot": {
            const { sessionId, fullPage = false, selector } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            result = await takeScreenshot(sessionId, fullPage, selector);
            break;
          }

          case "click_element": {
            const { sessionId, selector, text, waitAfter = 1000 } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            if (!selector && !text) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "Either selector or text parameter is required"
              );
            }
            result = await clickElement(sessionId, selector, text, waitAfter);
            break;
          }

          case "fill_form": {
            const { sessionId, fields, submitButton } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            if (!fields || !Array.isArray(fields)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "fields parameter must be an array"
              );
            }
            result = await fillForm(sessionId, fields, submitButton);
            break;
          }

          case "switch_tab": {
            const { sessionId, tabIndex } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            if (typeof tabIndex !== "number") {
              throw new McpError(
                ErrorCode.InvalidParams,
                "tabIndex parameter must be a number"
              );
            }
            result = await switchTab(sessionId, tabIndex);
            break;
          }

          case "navigate_to_url": {
            const { sessionId, url, waitUntil = "load" } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            if (!url) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "url parameter is required"
              );
            }
            result = await navigateToUrl(sessionId, url, waitUntil);
            break;
          }

          case "wait_for_element": {
            const { sessionId, selector, timeout = 30000 } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            if (!selector) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "selector parameter is required"
              );
            }
            result = await waitForElement(sessionId, selector, timeout);
            break;
          }

          case "get_current_page_info": {
            const { sessionId } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            result = await getCurrentPageInfo(sessionId);
            break;
          }

          case "close_session": {
            const { sessionId } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            result = await closeSession(sessionId);
            break;
          }

          case "start_network_capture": {
            const { sessionId, options = {} } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            result = await startNetworkCapture(sessionId, options);
            break;
          }

          case "stop_network_capture": {
            const { sessionId } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            result = await stopNetworkCapture(sessionId);
            break;
          }

          case "get_network_capture_status": {
            const { sessionId } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            result = await getNetworkCaptureStatus(sessionId);
            break;
          }

          case "clear_network_capture": {
            const { sessionId } = args;
            if (!sessionId) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "sessionId parameter is required"
              );
            }
            result = await clearNetworkCapture(sessionId);
            break;
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${toolName}`
            );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute ${toolName}: ${error.message}`
        );
      }
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error("[MCP Error]", error);

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Reverse Engineer MCP server running on stdio");
  }
}

const server = new ReverseEngineerServer();
server.run().catch(console.error);
