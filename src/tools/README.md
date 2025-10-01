# Tools Directory

This directory contains all reverse engineering tools organized by functionality.

## File Structure

```
tools/
├── reverseEngineer.js       # Main export file (re-exports all tools)
├── reverseEngineerChat.js   # Automated reverse engineering tool
├── sessionManagement.js     # Session lifecycle management
├── visualInspection.js      # Screenshots and page info
├── interaction.js           # Clicking, form filling, waiting
└── navigation.js            # URL navigation and tab switching
```

## Module Organization

### 1. `reverseEngineer.js` (Index File)

Central export file that re-exports all tools from their respective modules. This is the main entry point used by `src/index.js`.

**Exports:**

- All tools from the modules below

---

### 2. `reverseEngineerChat.js`

Automated reverse engineering tool that captures streaming endpoints.

**Exports:**

- `reverseEngineerChat(targetUrl, message, captureWindowMs)` - One-shot automated analysis

**Use case:** Simple chats without authentication

---

### 3. `sessionManagement.js`

Manages browser session lifecycle.

**Exports:**

- `initializeSession(url, headless)` - Create new browser session
- `closeSession(sessionId)` - Clean up and close session
- `getSession(sessionId)` - Internal helper to get session (used by other modules)

**Dependencies:** BrowserUtilities

---

### 4. `visualInspection.js`

Visual feedback and page information tools.

**Exports:**

- `takeScreenshot(sessionId, fullPage, selector)` - Capture screenshots
- `getCurrentPageInfo(sessionId)` - Get page URLs, titles, and tabs

**Dependencies:** sessionManagement (uses `getSession`)

---

### 5. `interaction.js`

User interaction tools for clicking, filling forms, and waiting.

**Exports:**

- `clickElement(sessionId, selector, text, waitAfter)` - Click buttons/elements
- `fillForm(sessionId, fields, submitButton)` - Fill form fields
- `waitForElement(sessionId, selector, timeout)` - Wait for elements to appear

**Dependencies:** sessionManagement (uses `getSession`)

---

### 6. `navigation.js`

Navigation and tab management tools.

**Exports:**

- `navigateToUrl(sessionId, url, waitUntil)` - Navigate to different URLs
- `switchTab(sessionId, tabIndex)` - Switch between browser tabs

**Dependencies:** sessionManagement (uses `getSession`)

---

## Dependency Graph

```
reverseEngineer.js (index)
    ├── reverseEngineerChat.js
    │       ├── BrowserUtilities
    │       └── NetworkUtilities
    │
    ├── sessionManagement.js
    │       └── BrowserUtilities
    │
    ├── visualInspection.js
    │       └── sessionManagement
    │
    ├── interaction.js
    │       └── sessionManagement
    │
    └── navigation.js
            └── sessionManagement
```

## Design Principles

1. **Separation of Concerns** - Each file has a single, clear responsibility
2. **Shared Session State** - `sessionManagement.js` maintains the session Map
3. **Helper Function** - `getSession()` provides validation and error handling
4. **Clean Imports** - All tools import through `reverseEngineer.js` index
5. **No Circular Dependencies** - Clear dependency hierarchy

## Adding New Tools

To add a new tool:

1. Create a new file (e.g., `newFeature.js`)
2. Import `getSession` if you need session access:
   ```javascript
   import { getSession } from "./sessionManagement.js";
   ```
3. Export your tool functions
4. Add export to `reverseEngineer.js`:
   ```javascript
   export { newTool } from "./newFeature.js";
   ```
5. Add to `src/index.js` tool handlers

## Testing

All tools can be tested through:

```bash
npm run test:interactive
npm run test:interactive:login
```

Test files are located in `test/test-interactive-tools.js`
