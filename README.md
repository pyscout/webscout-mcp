# 🔍 WebScout MCP# 🔍 WebScout MCP

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-0.5.0-orange)](https://github.com/modelcontextprotocol/sdk)[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-0.5.0-orange)](https://github.com/modelcontextprotocol/sdk)

**WebScout MCP** is a powerful Model Context Protocol (MCP) server designed for reverse engineering web applications, particularly chat interfaces and streaming APIs. It provides comprehensive browser automation tools to discover, analyze, and capture network traffic from complex web applications.**WebScout MCP** is a powerful Model Context Protocol (MCP) server designed for reverse engineering web applications, particularly chat interfaces and streaming APIs. It provides comprehensive browser automation tools to discover, analyze, and capture network traffic from complex web applications.

---## ✨ Key Features

## ✨ Key Features### 🤖 Automated Reverse Engineering

### 🤖 Automated Reverse Engineering- **One-Click Analysis**: Automatically navigate to web applications and capture streaming endpoints

- **One-Click Analysis**: Automatically navigate to web applications and capture streaming endpoints- **Smart Pattern Detection**: Advanced detection of SSE, WebSocket, chunked transfers, and custom streaming formats

- **Smart Pattern Detection**: Advanced detection of SSE, WebSocket, chunked transfers, and custom streaming formats- **Network Traffic Capture**: Comprehensive CDP-level monitoring of all HTTP requests, responses, and WebSocket frames

- **Network Traffic Capture**: Comprehensive CDP-level monitoring of all HTTP requests, responses, and WebSocket frames- **Structured Data Output**: Clean, parsed data with URLs, request payloads, and response patterns

- **Structured Data Output**: Clean, parsed data with URLs, request payloads, and response patterns

### 🔐 Interactive Browser Automation

### 🔐 Interactive Browser Automation

- **Session Management**: Persistent browser sessions with cookie and authentication state management- **Session Management**: Persistent browser sessions with cookie and authentication state management

- **Authentication Support**: Handle login forms, OAuth flows, and multi-factor authentication- **Authentication Support**: Handle login forms, OAuth flows, and multi-factor authentication

- **Step-by-Step Navigation**: Click buttons, fill forms, and navigate through complex multi-page interfaces- **Step-by-Step Navigation**: Click buttons, fill forms, and navigate through complex multi-page interfaces

- **Visual Feedback**: Take screenshots at any point to understand page state and UI elements- **Visual Feedback**: Take screenshots at any point to understand page state and UI elements

### 🎯 Advanced Network Monitoring### 🎯 Advanced Network Monitoring

- **Real-Time Capture**: Monitor streaming responses as they occur with configurable capture windows

- **Flexible Filtering**: Capture all traffic or filter by POST requests, streaming responses, or URL patterns- **Real-Time Capture**: Monitor streaming responses as they occur with configurable capture windows

- **WebSocket Support**: Full capture of WebSocket frames, messages, and connection details- **Flexible Filtering**: Capture all traffic or filter by POST requests, streaming responses, or URL patterns

- **Memory Management**: Configurable capture limits to prevent memory issues during long sessions- **WebSocket Support**: Full capture of WebSocket frames, messages, and connection details

- **Memory Management**: Configurable capture limits to prevent memory issues during long sessions

### 🛠️ Developer-Friendly Tools

- **14 Specialized Tools**: Comprehensive toolkit for web scraping, testing, and API discovery### �️ Developer-Friendly Tools

- **Headless or Visible**: Run in headless mode for automation or visible mode for debugging

- **Error Handling**: Robust error handling with detailed error messages and recovery options- **14 Specialized Tools**: Comprehensive toolkit for web scraping, testing, and API discovery

- **Cross-Platform**: Works on macOS, Linux, and Windows with consistent behavior- **Headless or Visible**: Run in headless mode for automation or visible mode for debugging

- **Error Handling**: Robust error handling with detailed error messages and recovery options

---- **Cross-Platform**: Works on macOS, Linux, and Windows with consistent behavior

## 📋 Available Tools## 📋 Available Tools

### Core Reverse Engineering### Core Reverse Engineering

- **`reverse_engineer_chat`** - Automated analysis of chat interfaces with streaming endpoint discovery

- **`start_network_capture`** - Begin comprehensive network traffic monitoring- **`reverse_engineer_chat`** - Automated analysis of chat interfaces with streaming endpoint discovery

- **`stop_network_capture`** - End capture and retrieve all collected data- **`start_network_capture`** - Begin comprehensive network traffic monitoring

- **`get_network_capture_status`** - Check capture session status and statistics- **`stop_network_capture`** - End capture and retrieve all collected data

- **`clear_network_capture`** - Clear captured data without stopping the capture session- **`get_network_capture_status`** - Check capture session status and statistics

### Interactive Browser Control### Interactive Browser Control

- **`initialize_session`** - Create a new browser session for interactive operations

- **`close_session`** - Clean up browser resources and end session- **`initialize_session`** - Create a new browser session for interactive operations

- **`navigate_to_url`** - Navigate to different URLs within a session- **`close_session`** - Clean up browser resources and end session

- **`switch_tab`** - Switch between open browser tabs- **`navigate_to_url`** - Navigate to different URLs within a session

- **`switch_tab`** - Switch between open browser tabs

### User Interaction Simulation

- **`click_element`** - Click buttons, links, or any interactive elements### User Interaction Simulation

- **`fill_form`** - Fill out form fields with automatic submission options

- **`wait_for_element`** - Wait for dynamic elements to appear before continuing- **`click_element`** - Click buttons, links, or any interactive elements

- **`fill_form`** - Fill out form fields with automatic submission options

### Visual Inspection- **`wait_for_element`** - Wait for dynamic elements to appear before continuing

- **`take_screenshot`** - Capture screenshots of viewport, full page, or specific elements

- **`get_current_page_info`** - Retrieve comprehensive page information and tab details### Visual Inspection

---- **`take_screenshot`** - Capture screenshots of viewport, full page, or specific elements

- **`get_current_page_info`** - Retrieve comprehensive page information and tab details

## 🚀 Installation

### Network Management

### Prerequisites

- **Node.js 18+** - Required for ES modules and modern JavaScript features- **`clear_network_capture`** - Clear captured data without stopping the capture session

- **npm** - Package manager for dependency installation

## 🚀 Installation

### Quick Setup

````bash### Prerequisites

# Clone the repository

git clone <repository-url>- **Node.js 18+** - Required for ES modules and modern JavaScript features

cd webscout-mcp- **npm** - Package manager for dependency installation



# Install dependencies### Quick Setup

npm install

```bash

# Install Playwright browsers for automation# Clone the repository

npx playwright installgit clone <repository-url>

```cd webscout-mcp



---# Install dependencies

npm install

## 📖 Usage

# Install Playwright browsers for automation

### Method 1: MCP Server (Recommended)npx playwright install

````

Add WebScout MCP to your MCP client configuration:

## 📖 Usage

````json

{### Method 1: MCP Server (Recommended)

  "mcpServers": {

    "webscout-mcp": {Add WebScout MCP to your MCP client configuration:

      "command": "node",

      "args": ["/absolute/path/to/webscout-mcp/src/index.js"]```json

    }{

  }  "mcpServers": {

}    "webscout-mcp": {

```      "command": "node",

      "args": ["/absolute/path/to/webscout-mcp/src/index.js"]

### Method 2: Direct CLI Usage    }

  }

```bash}

# Start the MCP server directly```

npm start

### Method 2: Direct CLI Usage

# Or run with node

node src/index.js```bash

```# Start the MCP server directly

npm start

### Method 3: Development Mode

# Or run with node

```bashnode src/index.js

# Run with visible browser for debugging```

node src/index.js  # Set headless: false in session initialization

```### Method 3: Development Mode



---```bash

# Run with visible browser for debugging

## 🛠️ API Examplesnode src/index.js  # Set headless: false in session initialization

````

### Basic Chat Interface Analysis

````javascript## 🛠️ API Examples

// Initialize session and analyze a chat interface

const session = await initializeSession("https://chat.example.com");### Basic Chat Interface Analysis

const analysis = await reverseEngineerChat("https://chat.example.com", "Hello", 8000);

console.log("Found endpoints:", analysis.length);```javascript

await closeSession(session.sessionId);// Initialize session and analyze a chat interface

```const session = await initializeSession("https://chat.example.com");

const analysis = await reverseEngineerChat(

### Interactive Login Flow  "https://chat.example.com",

```javascript  "Hello",

// Handle login and navigate to protected content  8000

const session = await initializeSession("https://app.example.com/login"););

await fillForm(session.sessionId, [console.log("Found endpoints:", analysis.length);

  { selector: 'input[name="email"]', value: "user@example.com" },await closeSession(session.sessionId);

  { selector: 'input[name="password"]', value: "password123" }```

], 'button[type="submit"]');

await waitForElement(session.sessionId, ".dashboard", 10000);### Interactive Login Flow

const screenshot = await takeScreenshot(session.sessionId);

await closeSession(session.sessionId);```javascript

```// Handle login and navigate to protected content

const session = await initializeSession("https://app.example.com/login");

### Network Traffic Captureawait fillForm(

```javascript  session.sessionId,

// Monitor all network activity on a page  [

const session = await initializeSession("https://api.example.com");    { selector: 'input[name="email"]', value: "user@example.com" },

await startNetworkCapture(session.sessionId, {    { selector: 'input[name="password"]', value: "password123" },

  capturePostOnly: false,  ],

  captureStreaming: true,  'button[type="submit"]'

  maxCaptures: 100);

});await waitForElement(session.sessionId, ".dashboard", 10000);

// Perform actions that generate network trafficconst screenshot = await takeScreenshot(session.sessionId);

await navigateToUrl(session.sessionId, "https://api.example.com/data");await closeSession(session.sessionId);

const captureData = await stopNetworkCapture(session.sessionId);```

console.log("Captured requests:", captureData.data.requests.length);

await closeSession(session.sessionId);### Network Traffic Capture

````

````javascript

---// Monitor all network activity on a page

const session = await initializeSession("https://api.example.com");

## 🏗️ Architecture Overviewawait startNetworkCapture(session.sessionId, {

  capturePostOnly: false,

```  captureStreaming: true,

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐  maxCaptures: 100,

│ Chat Interface  │───▶│ Browser Automation│───▶│ Network Capture │});

│  (Target URL)   │    │   (Playwright)    │    │  (CDP + Route)  │// Perform actions that generate network traffic

└─────────────────┘    └──────────────────┘    └─────────────────┘await navigateToUrl(session.sessionId, "https://api.example.com/data");

         │                       │                       │const captureData = await stopNetworkCapture(session.sessionId);

         ▼                       ▼                       ▼console.log("Captured requests:", captureData.data.requests.length);

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐await closeSession(session.sessionId);

│  Message Input  │    │  DOM Interaction  │    │ Request/Response│```

│   Detection     │    │    (Auto-fill)    │    │    Analysis     │

└─────────────────┘    └──────────────────┘    └─────────────────┘## 📁 Project Structure

                                                       │

                                                       ▼```

                                            ┌─────────────────┐webscout-mcp/

                                            │ Structured Data │├── src/

                                            │  Output (JSON)  ││   ├── index.js                 # Main MCP server implementation

                                            └─────────────────┘│   └── tools/                   # Specialized tool modules

```│       ├── reverseEngineer.js   # Tool exports and coordination

│       ├── reverseEngineerChat.js # Automated chat analysis

### Workflow│       ├── sessionManagement.js # Browser session lifecycle

│       ├── visualInspection.js  # Screenshots and page info

1. **Browser Launch**: Opens target URL in headless Playwright browser│       ├── interaction.js       # Clicking and form filling

2. **Network Setup**: Establishes Chrome DevTools Protocol (CDP) session and route interception│       ├── navigation.js        # URL navigation and tab switching

3. **Interface Detection**: Automatically locates chat input elements (textarea, contenteditable, etc.)│       └── networkCapture.js    # Network traffic monitoring

4. **Message Injection**: Sends test message to trigger streaming responses├── package.json                 # Dependencies and scripts

5. **Traffic Capture**: Monitors network requests/responses for specified time window├── mcp-config.json              # MCP client configuration example

6. **Pattern Analysis**: Identifies streaming patterns in captured data├── README.md                    # This documentation

7. **Data Processing**: Structures captured data into clean JSON format└── node_modules/                # Dependencies (installed)

````

### Streaming Detection Patterns

## 🔧 Configuration

The system detects multiple streaming response formats:

- **Server-Sent Events (SSE)**: `data: {"content": "..."}`### Environment Variables

- **OpenAI-style chunks**: `data: {"choices": [{"delta": {"content": "..."}}]}`

- **Event streams**: `event: message\ndata: {...}`- `NODE_ENV` - Set to "production" for production deployments

- **JSON streaming**: Objects with `token`, `delta`, `content` fields- `DEBUG` - Enable debug logging (optional)

- **Custom formats**: `f:{...}`, `0:"..."`, `e:{...}` patterns

- **WebSocket messages**: Binary/text frames with streaming data### MCP Configuration

- **Chunked responses**: Transfer-encoding: chunked with streaming content

Update your MCP client's configuration file with the server details:

---

````json

## 📁 Project Structure{

  "mcpServers": {

```    "webscout-mcp": {

webscout-mcp/      "command": "node",

├── src/      "args": ["/path/to/webscout-mcp/src/index.js"],

│   ├── index.js                  # Main MCP server implementation      "env": {

│   ├── tools/                    # Specialized tool modules        "NODE_ENV": "production"

│   │   ├── reverseEngineer.js    # Tool exports and coordination      }

│   │   ├── reverseEngineerChat.js# Automated chat analysis    }

│   │   ├── sessionManagement.js  # Browser session lifecycle  }

│   │   ├── visualInspection.js   # Screenshots and page info}

│   │   ├── interaction.js        # Clicking and form filling```

│   │   ├── navigation.js         # URL navigation and tab switching

│   │   └── networkCapture.js     # Network traffic monitoring## 🧪 Testing

│   └── utilities/                # Shared utility functions

│       ├── browser.js            # Browser automation utilitiesRun the comprehensive test suite:

│       └── network.js            # Network pattern detection

├── package.json                  # Dependencies and scripts```bash

├── mcp-config.json               # MCP client configuration example# Run all tests

├── README.md                     # This documentationnpm test

└── .gitignore                    # Git ignore patterns

```# Run specific test suites

npm run test:utils      # Utility function tests

---npm run test:mcp        # MCP server functionality

npm run test:interactive # Interactive browser tools

## 🔧 Configuration```



### Environment Variables## 🤝 Contributing

- `NODE_ENV` - Set to "production" for production deployments (default: "development")

- `DEBUG` - Enable debug logging (optional)1. Fork the repository

2. Create a feature branch: `git checkout -b feature-name`

### MCP Configuration3. Make your changes and add tests

4. Run tests: `npm test`

Create or update your MCP client's configuration file:5. Submit a pull request



```json## 📄 License

{

  "mcpServers": {This project is licensed under the ISC License - see the LICENSE file for details.

    "webscout-mcp": {

      "command": "node",## 🙏 Acknowledgments

      "args": ["/path/to/webscout-mcp/src/index.js"],

      "env": {- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)

        "NODE_ENV": "production"- Powered by [Playwright](https://playwright.dev/) for browser automation

      }- Inspired by the need for better web API discovery and testing tools

    }

  }---

}

```**WebScout MCP** - Your intelligent companion for web application reverse engineering and API discovery.



---### Method 2: Direct CLI Usage



## 🧪 Testing```bash

# Start the MCP server directly

WebScout MCP includes a comprehensive test suite to ensure reliability.npm start



### Running Tests# Or run with node

node server.js

```bash```

# Run all tests

npm test### Method 3: Legacy Capture Script



# Run specific test suitesFor direct network capture without MCP:

npm run test:utils       # Utility function tests

npm run test:mcp         # MCP server functionality```bash

npm run test:interactive # Interactive browser tools# Run the legacy capture script

```npm run capture



### Test Coverage# Or directly

node capture_chat_network.cjs "https://chat.example.com"

- ✅ MCP protocol compliance```

- ✅ Tool registration and execution

- ✅ Streaming detection (SSE, chunked, WebSocket)## 🛠️ API Reference

- ✅ Data parsing and formatting

- ✅ Browser automation utilities### `reverse_engineer_chat` Tool

- ✅ Error handling and edge cases

Reverse engineers a chat interface to discover streaming endpoints and capture network traffic.

---

#### Parameters

## 🐛 Troubleshooting

| Parameter         | Type     | Required | Default | Description                                     |

### Common Issues| ----------------- | -------- | -------- | ------- | ----------------------------------------------- |

| `url`             | `string` | ✅       | -       | The URL of the chat interface to analyze        |

**"Browser not found" error**| `message`         | `string` | ❌       | `"hi"`  | Message to send to trigger streaming response   |

```bash| `captureWindowMs` | `number` | ❌       | `8000`  | Time in milliseconds to capture network traffic |

# Install Playwright browsers

npx playwright install#### Example Request

````

`````json

**"Connection timeout" error**{

- Increase `captureWindowMs` parameter  "method": "tools/call",

- Check network connectivity  "params": {

- Verify target URL is accessible    "name": "reverse_engineer_chat",

    "arguments": {

**"No streaming endpoints found"**      "url": "https://deepinfra.com/chat",

- Try different test messages      "message": "Hello, how are you?",

- Increase capture window time      "captureWindowMs": 10000

- Verify the chat interface doesn't require authentication    }

  }

**MCP connection issues**}

- Verify the absolute path in `mcp-config.json````

- Ensure Node.js 18+ is installed

- Check MCP client logs for detailed errors#### Example Response



---```json

{

## 🤝 Contributing  "result": {

    "content": [

We welcome contributions! Please follow these steps:      {

        "type": "text",

1. **Fork** the repository        "text": "[{\"url\":\"https://api.deepinfra.com/v1/openai/chat/completions\",\"input\":\"{\\\"model\\\":\\\"deepseek-ai/DeepSeek-V3.1\\\",\\\"messages\\\":[{\\\"role\\\":\\\"system\\\",\\\"content\\\":\\\"Be a helpful assistant\\\"},{\\\"role\\\":\\\"user\\\",\\\"content\\\":\\\"Hello\\\"}],\\\"stream\\\":true}\",\"output\":\"data: {\\\"id\\\": \\\"chatcmpl-123\\\", \\\"object\\\": \\\"chat.completion.chunk\\\", \\\"choices\\\": [{\\\"delta\\\": {\\\"content\\\": \\\"Hello!\\\"}}]}\\ndata: {\\\"id\\\": \\\"chatcmpl-123\\\", \\\"choices\\\": [{\\\"delta\\\": {\\\"content\\\": \\\" How can I help you?\\\"}}]}\\ndata: [DONE]\"}]"

2. **Create** a feature branch: `git checkout -b feature/amazing-feature`      }

3. **Commit** your changes: `git commit -m 'Add amazing feature'`    ]

4. **Push** to the branch: `git push origin feature/amazing-feature`  }

5. **Open** a Pull Request}

`````

### Development Guidelines

- Follow ES6+ syntax and modern JavaScript practices## 🏗️ How It Works

- Add JSDoc comments for new functions

- Test your changes with multiple chat interfaces### Architecture Overview

- Update documentation for new features

- Ensure code passes all tests```

┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐

---│ Chat Interface │───▶│ Browser Automation │───▶│ Network Capture │

│ (Target URL) │ │ (Playwright) │ │ (CDP + Route) │

## ⚠️ Important Notes└─────────────────┘ └──────────────────┘ └─────────────────┘

         │                       │                       │

- **Ethical Use**: This tool is intended for API analysis and integration purposes only. Always respect website terms of service and robots.txt files. ▼ ▼ ▼

- **Rate Limiting**: Some chat interfaces may have rate limits or CAPTCHAs that could interfere with analysis.┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐

- **Browser Dependencies**: Playwright requires browser binaries to be installed for automation.│ Message Input │ │ DOM Interaction │ │ Request/Response│

- **Network Conditions**: Results may vary based on network speed and target website performance.│ Detection │ │ (Auto-fill) │ │ Analysis │

└─────────────────┘ └──────────────────┘ └─────────────────┘

--- │

                                                       ▼

## 📋 Requirements ┌─────────────────┐

                                            │  Structured Data │

- **Node.js**: >= 18.0.0 │ Output (JSON) │

- **npm**: Latest stable version └─────────────────┘

- **Playwright**: Browsers installed via `npx playwright install````

- **Operating System**: macOS, Linux, or Windows

### Workflow

---

1. **Browser Launch**: Opens target URL in headless Playwright browser

## 📄 License2. **Network Setup**: Establishes Chrome DevTools Protocol (CDP) session and route interception

3. **Interface Detection**: Automatically locates chat input elements (textarea, contenteditable, etc.)

This project is licensed under the ISC License - see the LICENSE file for details.4. **Message Injection**: Sends test message to trigger streaming responses

5. **Traffic Capture**: Monitors network requests/responses for specified time window

---6. **Pattern Analysis**: Identifies streaming patterns in captured data

7. **Data Processing**: Structures captured data into clean JSON format

## 🙏 Acknowledgments

### Streaming Detection Patterns

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)

- Powered by [Playwright](https://playwright.dev/) for browser automationThe system detects multiple streaming response formats:

- Inspired by the need for better web API discovery and testing tools

- **Server-Sent Events (SSE)**: `data: {"content": "..."}`

---- **OpenAI-style chunks**: `data: {"choices": [{"delta": {"content": "..."}}]}`

- **Event streams**: `event: message\ndata: {...}`

## 📞 Support- **JSON streaming**: Objects with `token`, `delta`, `content` fields

- **Custom formats**: `f:{...}`, `0:"..."`, `e:{...}` patterns

If you encounter issues or have questions:- **WebSocket messages**: Binary/text frames with streaming data

- **Chunked responses**: Transfer-encoding: chunked with streaming content

1. Check the [Troubleshooting](#-troubleshooting) section

2. Review existing [Issues](../../issues) on GitHub## 📁 Project Structure

3. Create a new [Issue](../../issues/new) with detailed information

```

---webscout/

├── server.js                 # Main MCP server implementation

**WebScout MCP** - Your intelligent companion for web application reverse engineering and API discovery.├── capture_chat_network.cjs  # Legacy direct capture script

├── package.json             # Dependencies and scripts

*Made with ❤️ for developers, security researchers, and API enthusiasts*├── mcp-config.json          # MCP client configuration example

├── README.md                # This file
└── node_modules/            # Dependencies (installed)
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
      "command": "node",
      "args": ["/path/to/webscout-mcp/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🧪 Development

### Available Scripts

```bash
# Start the MCP server
npm start

# Run tests (when available)
npm test

# Run example usage
npm run example

# Run legacy capture script
npm run capture
```

### Building from Source

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Start development server
npm start
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow ES6+ syntax and modern JavaScript practices
- Add JSDoc comments for new functions
- Test your changes with multiple chat interfaces
- Update documentation for new features
- Ensure code passes linting (if configured)

## 🧪 Testing

The project includes comprehensive tests for both the MCP server and utility functions.

### Running Tests

```bash
# Run all tests
npm test

# Run only utility tests
npm run test:utils

# Run only MCP integration tests
npm run test:mcp

# Run with a real chat interface
npm run test:real -- https://your-chat-url.com

# Run example/demo
node test/example.js
```

### Test Files

- **`test/test-utilities.js`** - Unit tests for utility functions

  - Network pattern detection
  - Data parsing and formatting
  - Browser utilities
  - Edge cases and error handling

- **`test/test-mcp.js`** - Integration tests for MCP server

  - Server startup and initialization
  - Tool listing and invocation
  - Error handling
  - Real chat interface testing

- **`test/example.js`** - Example usage and demonstration
  - Shows how to use the client
  - Parameter explanations
  - Result interpretation

### Test Coverage

✅ MCP protocol compliance  
✅ Tool registration and execution  
✅ Streaming detection (SSE, chunked, WebSocket)  
✅ Data parsing and formatting  
✅ Browser automation utilities  
✅ Error handling and edge cases

See [`test/README.md`](test/README.md) for detailed testing documentation.

## 📋 Requirements

- **Node.js**: `>= 18.0.0`
- **npm**: Latest stable version
- **Playwright**: Browsers installed via `npx playwright install`
- **Operating System**: macOS, Linux, or Windows

## ⚠️ Important Notes

- **Ethical Use**: This tool is intended for API analysis and integration purposes only. Respect website terms of service and robots.txt files.
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
- Check if the chat interface requires authentication

**MCP connection issues**

- Verify the absolute path in `mcp-config.json`
- Ensure Node.js 18+ is installed
- Check MCP client logs for detailed errors

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the server framework
- [Playwright](https://playwright.dev/) for browser automation
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) for network inspection

## 📞 Support

If you encounter issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review existing [Issues](../../issues) on GitHub
3. Create a new [Issue](../../issues/new) with detailed information

---

**Made with ❤️ for API analysis and integration**
