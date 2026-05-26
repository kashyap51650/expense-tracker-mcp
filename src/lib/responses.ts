import type { Expense } from "@prisma/client";

export function serializeExpense(expense: Expense) {
  return {
    ...expense,
    date: expense.date.toISOString(),
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

export function textResponse(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}
