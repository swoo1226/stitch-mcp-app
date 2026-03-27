# Stitch-MCP Web App

This is a premium Next.js application integrated with the **Model Context Protocol (MCP)**, designed for the **Google Stitch** ecosystem.

## Features
- **Premium UI**: Glassmorphism, gradients, and modern typography.
- **MCP Server**: Integrated server exposing application context and theme tokens.
- **Stitch-Ready**: Optimized for the AI-native design workflow.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Web App
```bash
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

### 3. Connect to Stitch (MCP)
To use this app's context in Stitch, add the following MCP server configuration:

**Command:**
```bash
node scripts/mcp-server.js
```

**Transport:** `stdio`

## Available Tools
- `get_app_info`: Returns general information about the application.
- `get_theme_tokens`: Returns the CSS theme tokens (colors, fonts, etc.) for design consistency.
