import prisma from '../../config/db.js';
import { Prisma } from '@prisma/client';

/**
 * AnalyticsService provides high-performance dashboard analytics.
 * All aggregations are performed at the database level using raw PostgreSQL
 * queries via prisma.$queryRaw — no records are loaded into memory.
 */
export class AnalyticsService {
  /**
   * Returns total income, total expenses, net balance, and record count.
   * Uses a single SQL query with SUM(CASE WHEN...) for efficiency.
   */
  async getDashboardSummary() {
    // 1. Aggregated totals in a single trip
    const [summary] = await prisma.$queryRaw<
      {
        totalIncome: number;
        totalExpenses: number;
        totalRecords: number;
        incomeCount: number;
        expenseCount: number;
      }[]
    >`
      SELECT
        COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE 0 END), 0)::FLOAT AS "totalIncome",
        COALESCE(SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount" ELSE 0 END), 0)::FLOAT AS "totalExpenses",
        COUNT(*)::INT AS "totalRecords",
        COUNT(*) FILTER (WHERE "type" = 'INCOME')::INT AS "incomeCount",
        COUNT(*) FILTER (WHERE "type" = 'EXPENSE')::INT AS "expenseCount"
      FROM "Record"
      WHERE "deletedAt" IS NULL
    `;

    // 2. Recent activity (last 5 records with user name)
    const recentActivity = await prisma.$queryRaw<
      {
        id: string;
        amount: number;
        type: string;
        category: string;
        date: Date;
        createdAt: Date;
        user: { name: string };
      }[]
    >`
      SELECT
        r."id", r."amount", r."type", r."category", r."date", r."createdAt",
        u."name" AS "userName"
      FROM "Record" r
      JOIN "User" u ON r."userId" = u."id"
      WHERE r."deletedAt" IS NULL
      ORDER BY r."createdAt" DESC
      LIMIT 5
    `;

    // Map raw rows to match the original Prisma shape: { ...record, user: { name } }
    const mappedActivity = recentActivity.map((row: any) => ({
      id: row.id,
      amount: row.amount,
      type: row.type,
      category: row.category,
      date: row.date,
      createdAt: row.createdAt,
      user: { name: row.userName },
    }));

    const totalIncome = summary?.totalIncome ?? 0;
    const totalExpenses = summary?.totalExpenses ?? 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      totalRecords: summary?.totalRecords ?? 0,
      incomeCount: summary?.incomeCount ?? 0,
      expenseCount: summary?.expenseCount ?? 0,
      recentActivity: mappedActivity,
    };
  }

  /**
   * Returns spending/income breakdown by category.
   * Each entry includes the category name, total amount, and record count.
   */
  async getCategoryBreakdown() {
    const breakdown = await prisma.$queryRaw<
      { category: string; type: string; total: number; count: number }[]
    >`
      SELECT
        "category",
        "type",
        COALESCE(SUM("amount"), 0)::FLOAT AS "total",
        COUNT(*)::INT AS "count"
      FROM "Record"
      WHERE "deletedAt" IS NULL
      GROUP BY "category", "type"
      ORDER BY "total" DESC
    `;

    return breakdown;
  }

  /**
   * Returns monthly income and expense trends for the last 12 months.
   * All date grouping is performed in SQL using TO_CHAR.
   */
  async getMonthlyTrends() {
    const trends = await prisma.$queryRaw<
      { month: string; income: number; expense: number }[]
    >`
      SELECT
        TO_CHAR("date", 'YYYY-MM') AS "month",
        COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE 0 END), 0)::FLOAT AS "income",
        COALESCE(SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount" ELSE 0 END), 0)::FLOAT AS "expense"
      FROM "Record"
      WHERE "deletedAt" IS NULL
        AND "date" >= NOW() - INTERVAL '12 months'
      GROUP BY "month"
      ORDER BY "month" ASC
    `;

    return trends.map((row) => ({
      month: row.month,
      income: row.income,
      expense: row.expense,
      net: row.income - row.expense,
    }));
  }
}
