import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCategoryTools } from "./tools/categoryTools.js";
import { registerExpenseTools } from "./tools/expenseTools.js";

export function createMcpServer() {
  const server = new McpServer({
    name: "expense-tracker-mcp",
    version: "1.0.0",
  });

  registerExpenseTools(server);
  registerCategoryTools(server);

  return server;
}
