import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCategoryTools } from "./tools/categoryTools.js";
import { registerExpenseTools } from "./tools/expenseTools.js";

const server = new McpServer({
  name: "expense-tracker-mcp",
  version: "1.0.0",
});

let renderKeepalive: NodeJS.Timeout | undefined;

registerExpenseTools(server);
registerCategoryTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Expense Tracker MCP server running on stdio");

  // Render workers don't attach an MCP stdio client; keep one active handle
  // so the process is not treated as an early exit.
  if (process.env.RENDER) {
    renderKeepalive = setInterval(() => {
      // no-op keepalive
    }, 60_000);
    console.error("Render keepalive enabled for stdio worker");
  }
}

process.on("SIGTERM", () => {
  if (renderKeepalive) {
    clearInterval(renderKeepalive);
  }
});

process.on("SIGINT", () => {
  if (renderKeepalive) {
    clearInterval(renderKeepalive);
  }
});

try {
  await main();
} catch (error) {
  console.error("Fatal error in main():", error);
  process.exit(1);
}
