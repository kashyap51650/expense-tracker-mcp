import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { randomUUID } from "node:crypto";
import {
  StreamableHTTPServerTransport,
  type StreamableHTTPServerTransportOptions,
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./server.js";

let renderKeepalive: NodeJS.Timeout | undefined;
const transports = new Map<string, StreamableHTTPServerTransport>();

function getHeaderSessionId(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function clearRenderKeepalive() {
  if (renderKeepalive) {
    clearInterval(renderKeepalive);
    renderKeepalive = undefined;
  }
}

async function closeAllTransports() {
  await Promise.allSettled(
    [...transports.values()].map(async (transport) => {
      await transport.close();
    }),
  );
  transports.clear();
}

async function startStdioServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Expense Tracker MCP server running on stdio");

  if (process.env.RENDER) {
    renderKeepalive = setInterval(() => {
      // keep process alive in worker runtimes without a stdio MCP client
    }, 60_000);
    console.error("Render keepalive enabled for stdio worker");
  }
}

async function startHttpServer() {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const sessionId = getHeaderSessionId(req.headers["mcp-session-id"]);
    let transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      if (!isInitializeRequest(req.body)) {
        res.status(400).json({
          error: "No active session. Send an initialize request first.",
        });
        return;
      }

      const options: StreamableHTTPServerTransportOptions = {
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport!);
        },
      };

      transport = new StreamableHTTPServerTransport(options);
      transport.onclose = () => {
        if (transport?.sessionId) {
          transports.delete(transport.sessionId);
        }
      };

      const server = createMcpServer();
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = getHeaderSessionId(req.headers["mcp-session-id"]);
    const transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await transport.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = getHeaderSessionId(req.headers["mcp-session-id"]);
    const transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await transport.handleRequest(req, res);
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", transport: "streamable-http" });
  });

  const port = Number(process.env.PORT ?? "3000");
  await new Promise<void>((resolve) => {
    app.listen(port, () => resolve());
  });

  console.error(
    `Expense Tracker MCP server running on Streamable HTTP at port ${port}`,
  );
}

async function main() {
  const mode = process.env.MCP_TRANSPORT;
  const shouldUseHttp =
    mode === "http" || (mode !== "stdio" && !!process.env.PORT);

  if (shouldUseHttp) {
    await startHttpServer();
    return;
  }

  await startStdioServer();
}

async function shutdown() {
  clearRenderKeepalive();
  await closeAllTransports();
}

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});

try {
  await main();
} catch (error) {
  console.error("Fatal error in main():", error);
  process.exit(1);
}
