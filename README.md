# 🔍 WebScout MCP

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-0.5.0-orange)](https://github.com/modelcontextprotocol/sdk)

**WebScout MCP** is a powerful Model Context Protocol (MCP) server designed for reverse engineering web applications, particularly chat interfaces and streaming APIs. It provides comprehensive browser automation tools to discover, analyze, and capture network traffic from complex web applications.

## ✨ Key Features

### 🤖 Automated Reverse Engineering
- **One-Click Analysis**: Automatically navigate to web applications and capture streaming endpoints
- **Smart Pattern Detection**: Advanced detection of SSE, WebSocket, chunked transfers, and custom streaming formats
- **Network Traffic Capture**: Comprehensive CDP-level monitoring of all HTTP requests, responses, and WebSocket frames
- **Structured Data Output**: Clean, parsed data with URLs, request payloads, and response patterns

### 🔐 Interactive Browser Automation
- **Session Management**: Persistent browser sessions with cookie and authentication state management
- **Authentication Support**: Handle login forms, OAuth flows, and multi-factor authentication
- **Step-by-Step Navigation**: Click buttons, fill forms, and navigate through complex multi-page interfaces
- **Visual Feedback**: Take screenshots at any point to understand page state and UI elements

### 🎯 Advanced Network Monitoring
- **Real-Time Capture**: Monitor streaming responses as they occur with configurable capture windows
- **Flexible Filtering**: Capture all traffic or filter by POST requests, streaming responses, or URL patterns
- **WebSocket Support**: Full capture of WebSocket frames, messages, and connection details
- **Memory Management**: Configurable capture limits to prevent memory issues during long sessions

### 🛠️ Developer-Friendly Tools
- **14 Specialized Tools**: Comprehensive toolkit for web scraping, testing, and API discovery
- **Headless or Visible**: Run in headless mode for automation or visible mode for debugging
- **Error Handling**: Robust error handling with detailed error messages and recovery options
- **Cross-Platform**: Works on macOS, Linux, and Windows with consistent behavior

## 📋 Available Tools

### Core Reverse Engineering
- **`reverse_engineer_chat`** - Automated analysis of chat interfaces with streaming endpoint discovery
- **`start_network_capture`** - Begin comprehensive network traffic monitoring
- **`stop_network_capture`** - End capture and retrieve all collected data
- **`get_network_capture_status`** - Check capture session status and statistics
- **`clear_network_capture`** - Clear captured data without stopping the capture session

### Interactive Browser Control
- **`initialize_session`** - Create a new browser session for interactive operations
- **`close_session`** - Clean up browser resources and end session
- **`navigate_to_url`** - Navigate to different URLs within a session
- **`switch_tab`** - Switch between open browser tabs

### User Interaction Simulation
- **`click_element`** - Click buttons, links, or any interactive elements
- **`fill_form`** - Fill out form fields with automatic submission options
- **`wait_for_element`** - Wait for dynamic elements to appear before continuing

### Visual Inspection
- **`take_screenshot`** - Capture screenshots of viewport, full page, or specific elements
- **`get_current_page_info`** - Retrieve comprehensive page information and tab details

## 🚀 Installation

### Prerequisites
- **Node.js 18+** - Required for ES modules and modern JavaScript features
- **npm** - Package manager for dependency installation

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/pyscout/webscout-mcp
cd webscout-mcp

# Install dependencies
npm install

# Install Playwright browsers for automation
npx playwright install
```

## 📖 Usage

### Method 1: MCP Server (Recommended)

Add WebScout MCP to your MCP client configuration:

```json
{
  "mcpServers": {
    "webscout-mcp": {
      "command": "npx",
      "args": ["-y", "webscout-mcp"]
    }
  }
}
```

### Method 2: Direct CLI Usage

```bash
# Start the MCP server directly
npm start

# Or run with node
node src/index.js
```

### Method 3: Development Mode

```bash
# Run with visible browser for debugging
node src/index.js  # Set headless: false in session initialization
```

## 🛠️ API Examples

### Basic Chat Interface Analysis

```javascript
// Initialize session and analyze a chat interface
const session = await initializeSession("https://chat.example.com");
const analysis = await reverseEngineerChat("https://chat.example.com", "Hello", 8000);

console.log("Found endpoints:", analysis.length);
await closeSession(session.sessionId);
```

### Interactive Login Flow

```javascript
// Handle login and navigate to protected content
const session = await initializeSession("https://app.example.com/login");

await fillForm(session.sessionId, [
  { selector: 'input[name="email"]', value: "user@example.com" },
  { selector: 'input[name="password"]', value: "password123" }
], 'button[type="submit"]');

await waitForElement(session.sessionId, ".dashboard", 10000);
const screenshot = await takeScreenshot(session.sessionId);

await closeSession(session.sessionId);
```

### Network Traffic Capture

```javascript
// Monitor all network activity on a page
const session = await initializeSession("https://api.example.com");

await startNetworkCapture(session.sessionId, {
  capturePostOnly: false,
  captureStreaming: true,
  maxCaptures: 100
});

// Perform actions that generate network traffic
await navigateToUrl(session.sessionId, "https://api.example.com/data");

const captureData = await stopNetworkCapture(session.sessionId);
console.log("Captured requests:", captureData.data.requests.length);

await closeSession(session.sessionId);
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Chat Interface  │───▶│ Browser Automation│───▶│ Network Capture │
│  (Target URL)   │    │   (Playwright)    │    │  (CDP + Route)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Message Input  │    │  DOM Interaction  │    │ Request/Response│
│   Detection     │    │    (Auto-fill)    │    │    Analysis     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────┐
                                            │ Structured Data │
                                            │  Output (JSON)  │
                                            └─────────────────┘
```

### Workflow

1. **Browser Launch**: Opens target URL in headless Playwright browser
2. **Network Setup**: Establishes Chrome DevTools Protocol (CDP) session and route interception
3. **Interface Detection**: Automatically locates chat input elements (textarea, contenteditable, etc.)
4. **Message Injection**: Sends test message to trigger streaming responses
5. **Traffic Capture**: Monitors network requests/responses for specified time window
6. **Pattern Analysis**: Identifies streaming patterns in captured data
7. **Data Processing**: Structures captured data into clean JSON format

### Streaming Detection Patterns

The system detects multiple streaming response formats:

- **Server-Sent Events (SSE)**: `data: {"content": "..."}`
- **OpenAI-style chunks**: `data: {"choices": [{"delta": {"content": "..."}}]}`
- **Event streams**: `event: message\ndata: {...}`
- **JSON streaming**: Objects with `token`, `delta`, `content` fields
- **Custom formats**: `f:{...}`, `0:"..."`, `e:{...}` patterns
- **WebSocket messages**: Binary/text frames with streaming data
- **Chunked responses**: Transfer-encoding: chunked with streaming content

## 📁 Project Structure

```
webscout-mcp/
├── src/
│   ├── index.js                 # Main MCP server implementation
│   └── tools/                   # Specialized tool modules
│       ├── reverseEngineer.js   # Tool exports and coordination
│       ├── reverseEngineerChat.js # Automated chat analysis
│       ├── sessionManagement.js # Browser session lifecycle
│       ├── visualInspection.js  # Screenshots and page info
│       ├── interaction.js       # Clicking and form filling
│       ├── navigation.js        # URL navigation and tab switching
│       └── networkCapture.js    # Network traffic monitoring
│   └── utilities/               # Shared utility functions
│       ├── browser.js           # Browser automation utilities
│       └── network.js           # Network pattern detection
├── package.json                 # Dependencies and scripts
├── mcp-config.json              # MCP client configuration example
└── README.md                    # This documentation
```

## 🔧 Configuration

### Environment Variables

| Variable   | Description          | Default       |
| ---------- | -------------------- | ------------- |
| `NODE_ENV` | Environment mode     | `development` |
| `DEBUG`    | Enable debug logging | `false`       |

### MCP Configuration

Update your MCP client's configuration file:

```json
{
  "mcpServers": {
    "webscout-mcp": {
      "command": "npx",
      "args": ["-y", "webscout-mcp"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

Or for VS Code MCP configuration (`mcp.json`):

```json
{
  "servers": {
    "webscout-mcp": {
      "command": "npx",
      "args": ["-y", "webscout-mcp"],
      "type": "stdio"
    }
  }
}
```

##  Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Submit a pull request

### Development Guidelines

- Follow ES6+ syntax and modern JavaScript practices
- Add JSDoc comments for new functions
- Test your changes with multiple chat interfaces
- Update documentation for new features
- Ensure code passes all tests

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Powered by [Playwright](https://playwright.dev/) for browser automation
- Inspired by the need for better web API discovery and testing tools

## ⚠️ Important Notes

- **Ethical Use**: This tool is intended for API analysis and integration purposes only. Always respect website terms of service and robots.txt files.
- **Rate Limiting**: Some chat interfaces may have rate limits or CAPTCHAs that could interfere with analysis.
- **Browser Dependencies**: Playwright requires browser binaries to be installed for automation.
- **Network Conditions**: Results may vary based on network speed and target website performance.

## 🐛 Troubleshooting

### Common Issues

**"Browser not found" error**

```bash
# Install Playwright browsers
npx playwright install
```

**"Connection timeout" error**

- Increase `captureWindowMs` parameter
- Check network connectivity
- Verify target URL is accessible

**"No streaming endpoints found"**

- Try different test messages
- Increase capture window time
- Verify the chat interface doesn't require authentication

**MCP connection issues**

- Verify the absolute path in `mcp-config.json`
- Ensure Node.js 18+ is installed
- Check MCP client logs for detailed errors

## 📞 Support

If you encounter issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review existing [Issues](../../issues) on GitHub
3. Create a new [Issue](../../issues/new) with detailed information

---

**WebScout MCP** - Your intelligent companion for web application reverse engineering and API discovery.

*Made with ❤️ for developers, security researchers, and API enthusiasts*
