# Expense Tracker MCP

TypeScript MCP server for managing expenses in MongoDB through Prisma, with Zod validation.

## Tools

- `create_expense`
- `update_expense`
- `delete_expense`
- `list_expenses`
- `get_monthly_summary`
- `filter_expenses`
- `create_category`
- `budget_status`

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install dependencies.
3. Run `npm run prisma:generate`.
4. Push the Prisma schema to MongoDB with `npm run prisma:dbpush`.
5. Build with `npm run build` or run in dev with `npm run dev`.

## VS Code MCP config

Add this to `.vscode/mcp.json`:

```json
{
  "servers": {
    "expense-tracker-mcp": {
      "type": "stdio",
      "command": "npm",
      "args": ["run", "dev"]
    }
  }
}
```

## MCP Inspector

Run the inspector against the built server:

```bash
npm run inspect
```

This builds the project and starts MCP Inspector connected to `node build/index.js` over stdio.

## Deploy On Render

This project uses MCP over stdio, so deploy it on Render as a Background Worker (not a Web Service).

1. Push this repository to GitHub.
2. In Render, create a new Blueprint and select this repo.
3. Render will detect `render.yaml` and create a worker service.
4. Add `DATABASE_URL` in Render environment variables.
5. Deploy.

The included `render.yaml` uses:

- Build command: `npm ci && npm run prisma:generate && npm run build`
- Start command: `npm run start:render`

`start:render` runs Prisma schema sync (`prisma db push`) before starting the MCP server.

Note:
Because this server is stdio-based, it is best suited for MCP runtimes that can spawn and communicate with the process over stdio. A public HTTP endpoint is not exposed by this server.
