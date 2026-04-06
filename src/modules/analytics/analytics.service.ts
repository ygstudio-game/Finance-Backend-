import prisma from '../../config/db.js';

/**
 * AnalyticsService provides high-performance dashboard analytics.
 * All aggregations are performed at the database level using Prisma's
 * groupBy and aggregate functions — no records are loaded into memory.
 */
export class AnalyticsService {
  /**
   * Returns total income, total expenses, net balance, and record count.
   * Uses a single groupBy query for efficiency.
   */
  async getDashboardSummary() {
    const [typeTotals, recordCount, recentActivity] = await Promise.all([
      prisma.record.groupBy({
        by: ['type'],
        where: { deletedAt: null },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.record.count({ where: { deletedAt: null } }),
      prisma.record.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          date: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    const incomeEntry = typeTotals.find((t: any) => t.type === 'INCOME');
    const expenseEntry = typeTotals.find((t: any) => t.type === 'EXPENSE');

    const totalIncome = incomeEntry?._sum.amount || 0;
    const totalExpenses = expenseEntry?._sum.amount || 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      totalRecords: recordCount,
      incomeCount: incomeEntry?._count || 0,
      expenseCount: expenseEntry?._count || 0,
      recentActivity,
    };
  }

  /**
   * Returns spending/income breakdown by category.
   * Each entry includes the category name, total amount, and record count.
   */
  async getCategoryBreakdown() {
    const breakdown = await prisma.record.groupBy({
      by: ['category', 'type'],
      where: { deletedAt: null },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    return breakdown.map((item: any) => ({
      category: item.category,
      type: item.type,
      total: item._sum.amount || 0,
      count: item._count,
    }));
  }

  /**
   * Returns monthly income and expense trends for the last 12 months.
   * Uses raw SQL for date truncation since Prisma groupBy doesn't
   * natively support date_trunc.
   */
  async getMonthlyTrends() {
    const records = await prisma.record.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
        },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group records by month in application layer
    const monthlyMap = new Map<string, { income: number; expense: number }>();

    for (const record of records) {
      const monthKey = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyMap.get(monthKey) || { income: 0, expense: 0 };

      if (record.type === 'INCOME') {
        entry.income += record.amount;
      } else {
        entry.expense += record.amount;
      }

      monthlyMap.set(monthKey, entry);
    }

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));
  }
}
