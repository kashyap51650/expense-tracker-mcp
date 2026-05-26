import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  category: z.string().min(1).max(100),
  note: z.string().max(1000).optional(),
  date: z.string().datetime().optional(),
});

export const updateExpenseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).max(100).optional(),
  note: z.string().max(1000).nullable().optional(),
  date: z.string().datetime().optional(),
});

export const deleteExpenseSchema = z.object({
  id: z.string().min(1),
});

export const listExpensesSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  skip: z.number().int().min(0).optional().default(0),
});

export const monthlySummarySchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(1970).max(3000).optional(),
});

export const filterExpensesSchema = z.object({
  category: z.string().min(1).optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  titleContains: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const budgetStatusSchema = z.object({
  monthlyBudget: z.number().positive(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(1970).max(3000).optional(),
});
