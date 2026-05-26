import { Prisma } from "@prisma/client";

import { textResponse } from "./responses.js";

type ToolResponse = ReturnType<typeof textResponse>;

export function withToolErrors<TInput>(
  handler: (input: TInput) => Promise<ToolResponse>,
) {
  return async (input: TInput): Promise<ToolResponse> => {
    try {
      return await handler(input);
    } catch (error) {
      return textResponse(mapToolError(error));
    }
  };
}

function mapToolError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Database connection is unavailable. Check DATABASE_URL, network/VPN, and MongoDB availability, then retry.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "This record already exists (unique constraint).";
    }

    if (error.code === "P2025") {
      return "Requested record was not found.";
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return "Database query validation failed. Check input values and schema constraints.";
  }

  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("server selection timeout")
  ) {
    return "Could not reach MongoDB cluster (server selection timeout). Check Atlas allowlist/VPN and cluster health.";
  }

  if (error instanceof Error) {
    return `Operation failed: ${error.message}`;
  }

  return "Operation failed due to an unknown error.";
}
