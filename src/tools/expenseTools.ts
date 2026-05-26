import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { monthWindow } from "../lib/date.js";
import { prisma } from "../lib/prisma.js";
import { serializeExpense, textResponse } from "../lib/responses.js";
import { withToolErrors } from "../lib/toolErrors.js";
import {
  budgetStatusSchema,
  createExpenseSchema,
  deleteExpenseSchema,
  filterExpensesSchema,
  listExpensesSchema,
  monthlySummarySchema,
  updateExpenseSchema,
} from "../schemas/expenseSchemas.js";

export function registerExpenseTools(server: McpServer) {
  server.registerTool(
    "create_expense",
    {
      description: "Create a new expense record.",
      inputSchema: createExpenseSchema,
    },
    withToolErrors(async (input) => {
      const parsed = createExpenseSchema.parse(input);

      const category = await prisma.category.findUnique({
        where: { name: parsed.category },
      });

      if (!category) {
        return textResponse(
          `Category "${parsed.category}" does not exist. Create it first with create_category.`,
        );
      }

      const created = await prisma.expense.create({
        data: {
          title: parsed.title,
          amount: parsed.amount,
          category: parsed.category,
          note: parsed.note,
          date: parsed.date ? new Date(parsed.date) : undefined,
        },
      });

      return textResponse(JSON.stringify(serializeExpense(created), null, 2));
    }),
  );

  server.registerTool(
    "update_expense",
    {
      description: "Update an existing expense by id.",
      inputSchema: updateExpenseSchema,
    },
    withToolErrors(async (input) => {
      const parsed = updateExpenseSchema.parse(input);

      if (parsed.category) {
        const category = await prisma.category.findUnique({
          where: { name: parsed.category },
        });

        if (!category) {
          return textResponse(
            `Category "${parsed.category}" does not exist. Create it first with create_category.`,
          );
        }
      }

      const updated = await prisma.expense.update({
        where: { id: parsed.id },
        data: {
          ...(parsed.title === undefined ? {} : { title: parsed.title }),
          ...(parsed.amount === undefined ? {} : { amount: parsed.amount }),
          ...(parsed.category === undefined
            ? {}
            : { category: parsed.category }),
          ...(parsed.note === undefined ? {} : { note: parsed.note }),
          ...(parsed.date === undefined ? {} : { date: new Date(parsed.date) }),
        },
      });

      return textResponse(JSON.stringify(serializeExpense(updated), null, 2));
    }),
  );

  server.registerTool(
    "delete_expense",
    {
      description: "Delete an expense by id.",
      inputSchema: deleteExpenseSchema,
    },
    withToolErrors(async (input) => {
      const parsed = deleteExpenseSchema.parse(input);
      await prisma.expense.delete({ where: { id: parsed.id } });
      return textResponse(`Deleted expense ${parsed.id}.`);
    }),
  );

  server.registerTool(
    "list_expenses",
    {
      description: "List recent expenses.",
      inputSchema: listExpensesSchema,
    },
    withToolErrors(async (input) => {
      const parsed = listExpensesSchema.parse(input);
      const expenses = await prisma.expense.findMany({
        orderBy: { date: "desc" },
        take: parsed.limit,
        skip: parsed.skip,
      });

      return textResponse(
        JSON.stringify(expenses.map(serializeExpense), null, 2),
      );
    }),
  );

  server.registerTool(
    "get_monthly_summary",
    {
      description: "Get a spending summary for a month.",
      inputSchema: monthlySummarySchema,
    },
    withToolErrors(async (input) => {
      const parsed = monthlySummarySchema.parse(input);
      const { start, end, targetMonth, targetYear } = monthWindow(
        parsed.month,
        parsed.year,
      );

      const expenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: start,
            lt: end,
          },
        },
      });

      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const byCategory = expenses.reduce<Record<string, number>>(
        (accumulator, expense) => {
          accumulator[expense.category] =
            (accumulator[expense.category] ?? 0) + expense.amount;
          return accumulator;
        },
        {},
      );

      return textResponse(
        JSON.stringify(
          {
            month: targetMonth,
            year: targetYear,
            totalExpenses: total,
            expenseCount: expenses.length,
            byCategory,
          },
          null,
          2,
        ),
      );
    }),
  );

  server.registerTool(
    "filter_expenses",
    {
      description:
        "Filter expenses by category, amount, title, and date range.",
      inputSchema: filterExpensesSchema,
    },
    withToolErrors(async (input) => {
      const parsed = filterExpensesSchema.parse(input);
      const expenses = await prisma.expense.findMany({
        where: {
          ...(parsed.category ? { category: parsed.category } : {}),
          ...(parsed.minAmount !== undefined || parsed.maxAmount !== undefined
            ? {
                amount: {
                  ...(parsed.minAmount === undefined
                    ? {}
                    : { gte: parsed.minAmount }),
                  ...(parsed.maxAmount === undefined
                    ? {}
                    : { lte: parsed.maxAmount }),
                },
              }
            : {}),
          ...(parsed.startDate || parsed.endDate
            ? {
                date: {
                  ...(parsed.startDate
                    ? { gte: new Date(parsed.startDate) }
                    : {}),
                  ...(parsed.endDate ? { lte: new Date(parsed.endDate) } : {}),
                },
              }
            : {}),
          ...(parsed.titleContains
            ? {
                title: {
                  contains: parsed.titleContains,
                  mode: "insensitive",
                },
              }
            : {}),
        },
        orderBy: { date: "desc" },
        take: parsed.limit,
      });

      return textResponse(
        JSON.stringify(expenses.map(serializeExpense), null, 2),
      );
    }),
  );

  server.registerTool(
    "budget_status",
    {
      description: "Compare monthly spending against a budget.",
      inputSchema: budgetStatusSchema,
    },
    withToolErrors(async (input) => {
      const parsed = budgetStatusSchema.parse(input);
      const { start, end, targetMonth, targetYear } = monthWindow(
        parsed.month,
        parsed.year,
      );

      const expenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: start,
            lt: end,
          },
        },
      });

      const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const remaining = parsed.monthlyBudget - spent;
      const percentUsed =
        parsed.monthlyBudget === 0 ? 0 : (spent / parsed.monthlyBudget) * 100;

      return textResponse(
        JSON.stringify(
          {
            month: targetMonth,
            year: targetYear,
            monthlyBudget: parsed.monthlyBudget,
            spent,
            remaining,
            percentUsed,
            status:
              spent > parsed.monthlyBudget
                ? "over-budget"
                : spent === parsed.monthlyBudget
                  ? "at-budget"
                  : "under-budget",
          },
          null,
          2,
        ),
      );
    }),
  );
}
