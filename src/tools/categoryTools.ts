import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { prisma } from "../lib/prisma.js";
import { textResponse } from "../lib/responses.js";
import { withToolErrors } from "../lib/toolErrors.js";
import { createCategorySchema, listCategoriesSchema } from "../schemas/expenseSchemas.js";

export function registerCategoryTools(server: McpServer) {
  server.registerTool(
    "create_category",
    {
      description: "Create a new expense category.",
      inputSchema: createCategorySchema,
    },
    withToolErrors(async (input) => {
      const parsed = createCategorySchema.parse(input);

      const existing = await prisma.category.findUnique({
        where: { name: parsed.name },
      });

      const category =
        existing ??
        (await prisma.category.create({
          data: { name: parsed.name },
        }));

      return textResponse(JSON.stringify(category, null, 2));
    }),
  );

  server.registerTool(
    "list_categories",
    {
      description: "List all expense categories.",
      inputSchema: listCategoriesSchema,
    },
    withToolErrors(async () => {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });

      return textResponse(JSON.stringify(categories, null, 2));
    }),
  );
}
