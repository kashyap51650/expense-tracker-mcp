# Copilot Instructions

- This repository is a TypeScript MCP server.
- Use the official MCP TypeScript SDK: `@modelcontextprotocol/sdk`.
- Keep tool inputs validated with Zod.
- Keep persistence in Prisma with MongoDB as the datasource.
- STDIO transport is required; do not write normal output to stdout.
- Prefer small, focused tools that return JSON or concise text responses.
- Reference MCP docs:
  - https://modelcontextprotocol.io/llms.txt
  - https://modelcontextprotocol.io/docs/develop/build-server.md
