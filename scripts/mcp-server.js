import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "stitch-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_app_info",
        description: "Get information about the Stitch-MCP web app.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_theme_tokens",
        description: "Get the premium theme tokens used in the application.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handler for the tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_app_info": {
      return {
        content: [
          {
            type: "text",
            text: "Project Name: Stitch-MCP Web App\nFramework: Next.js\nTransport: StdIO\nDescription: A premium 'agent-ready' application designed for the Google Stitch ecosystem.",
          },
        ],
      };
    }
    case "get_theme_tokens": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              colors: {
                primary: "#6366f1",
                secondary: "#a855f7",
                background: "#050505",
              },
              fonts: {
                main: "Inter",
                display: "Outfit",
              },
              aesthetic: "Glassmorphism",
            }, null, 2),
          },
        ],
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on StdIO");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
