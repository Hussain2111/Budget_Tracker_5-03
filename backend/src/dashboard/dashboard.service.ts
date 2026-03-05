import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Expense } from "../expenses/entities/expense.entity";
import { Income } from "../income/entities/income.entity";
import { Saving } from "../savings/entities/saving.entity";

@Injectable()
export class DashboardService {
  constructor(
      @InjectRepository(Expense)
      private readonly expenseRepository: Repository<Expense>,
      @InjectRepository(Income)
      private readonly incomeRepository: Repository<Income>,
      @InjectRepository(Saving)
      private readonly savingRepository: Repository<Saving>,
  ) {}

  async getDashboardSummary(userId: string) {
    const expenses = await this.expenseRepository.find({ where: { userId } });
    const incomes = await this.incomeRepository.find({ where: { userId } });
    const savings = await this.savingRepository.find({ where: { userId } });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalSavingsGoal = savings.reduce(
        (sum, s) => sum + Number(s.targetAmount),
        0,
    );

    return {
      totalIncome,
      totalExpenses,
      currentBalance: totalIncome - totalExpenses,
      totalSavingsGoal,
      savingsCount: savings.length,
    };
  }

  async getMonthlySummary(userId: string, month: number, year: number) {
    const expenses = await this.expenseRepository.find({ where: { userId } });
    const incomes = await this.incomeRepository.find({ where: { userId } });

    const monthlyExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month - 1 && d.getFullYear() === year;
    });

    const monthlyIncomes = incomes.filter((i) => {
      const d = new Date(i.date);
      return d.getMonth() === month - 1 && d.getFullYear() === year;
    });

    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalIncome = monthlyIncomes.reduce((sum, i) => sum + Number(i.amount), 0);

    return {
      month,
      year,
      totalIncome,
      totalExpenses,
      monthlySavings: totalIncome - totalExpenses,
      expenseCount: monthlyExpenses.length,
      incomeCount: monthlyIncomes.length,
    };
  }

  async getMonthlyHistory(userId: string, months: number) {
    const safeMonths = Number.isFinite(months) ? Math.min(Math.max(months, 1), 36) : 12;

    const now = new Date();
    const data: Array<{
      month: number;
      year: number;
      totalIncome: number;
      totalExpenses: number;
      monthlySavings: number;
    }> = [];

    for (let i = safeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      const summary = await this.getMonthlySummary(userId, month, year);

      data.push({
        month,
        year,
        totalIncome: Number(summary.totalIncome),
        totalExpenses: Number(summary.totalExpenses),
        monthlySavings: Number(summary.monthlySavings),
      });
    }

    return { months: safeMonths, data };
  }

  async getExpensesByCategory(userId: string, month?: number, year?: number) {
    const expenses = await this.expenseRepository.find({ where: { userId } });

    const filtered =
        month && year
            ? expenses.filter((e) => {
              const d = new Date(e.date);
              return d.getMonth() === month - 1 && d.getFullYear() === year;
            })
            : expenses;

    const categoryMap = new Map<string, number>();
    filtered.forEach((e) => {
      categoryMap.set(e.type, (categoryMap.get(e.type) || 0) + Number(e.amount));
    });

    return Array.from(categoryMap.entries()).map(([type, amount]) => ({ type, amount }));
  }

  async getIncomeByCategory(userId: string, month?: number, year?: number) {
    const incomes = await this.incomeRepository.find({ where: { userId } });

    const filtered =
        month && year
            ? incomes.filter((i) => {
              const d = new Date(i.date);
              return d.getMonth() === month - 1 && d.getFullYear() === year;
            })
            : incomes;

    const categoryMap = new Map<string, number>();
    filtered.forEach((i) => {
      categoryMap.set(i.type, (categoryMap.get(i.type) || 0) + Number(i.amount));
    });

    return Array.from(categoryMap.entries()).map(([type, amount]) => ({ type, amount }));
  }
}