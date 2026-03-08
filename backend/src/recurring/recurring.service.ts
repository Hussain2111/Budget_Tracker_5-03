import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Income } from '../income/entities/income.entity';

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
  ) {}

  /**
   * Called on every login.  Finds all recurring templates whose
   * lastGeneratedMonth is behind the current month and generates
   * one child transaction per missed month (capped at 3 to avoid
   * flooding a long-absent user).
   */
  async processRecurringForUser(userId: string): Promise<{
    expensesCreated: number;
    incomeCreated: number;
  }> {
    const now = new Date();
    const currentMonth = this.toYearMonth(now);

    const [expensesCreated, incomeCreated] = await Promise.all([
      this.processEntity(userId, this.expenseRepository, currentMonth, 'expense'),
      this.processEntity(userId, this.incomeRepository, currentMonth, 'income'),
    ]);

    return { expensesCreated, incomeCreated };
  }

  private async processEntity<T extends Expense | Income>(
    userId: string,
    repo: Repository<T>,
    currentMonth: string,
    kind: string,
  ): Promise<number> {
    // Find all recurring templates for this user
    const templates = await repo.find({
      where: {
        userId,
        isRecurring: true,
        recurringParentId: null, // templates only — not generated children
      } as any,
    });

    let created = 0;

    for (const template of templates) {
      const lastGen = (template as any).lastGeneratedMonth as string | null;

      // Build the list of months that need to be generated
      const monthsNeeded = this.getMonthsToGenerate(lastGen, currentMonth);

      if (monthsNeeded.length === 0) continue;

      for (const monthStr of monthsNeeded) {
        // Safety: never create a duplicate for the same month
        const existing = await repo.findOne({
          where: {
            userId,
            recurringParentId: template.id,
          } as any,
        });

        // Check more precisely using date
        const monthDate = `${monthStr}-01`;
        const duplicate = await (repo as any).findOne({
          where: {
            userId,
            recurringParentId: template.id,
            date: monthDate,
          },
        });

        if (duplicate) continue;

        // Create child transaction dated the 1st of the target month
        const child = repo.create({
          ...(template as any),
          id: undefined,           // let DB generate new UUID
          createdAt: undefined,
          updatedAt: undefined,
          lastGeneratedMonth: undefined,
          recurringParentId: template.id,
          isRecurring: false,      // child is a plain transaction
          recurringFrequency: undefined,
          date: new Date(`${monthStr}-01`),
        } as any);

        await repo.save(child);
        created++;
      }

      // Update template's lastGeneratedMonth to current
      await repo.update(template.id, {
        lastGeneratedMonth: currentMonth,
      } as any);
    }

    return created;
  }

  /**
   * Returns the ordered list of YYYY-MM strings that need generating,
   * from the month after lastGenerated up to and including currentMonth.
   * Capped at 3 months to avoid flooding.
   */
  private getMonthsToGenerate(
    lastGenerated: string | null,
    currentMonth: string,
  ): string[] {
    const MAX_CATCHUP = 3;

    if (!lastGenerated) {
      // Never generated — only create for current month
      return [currentMonth];
    }

    if (lastGenerated >= currentMonth) {
      // Already up to date
      return [];
    }

    const months: string[] = [];
    let cursor = this.addMonths(lastGenerated, 1);

    while (cursor <= currentMonth && months.length < MAX_CATCHUP) {
      months.push(cursor);
      cursor = this.addMonths(cursor, 1);
    }

    return months;
  }

  /** YYYY-MM → add n months → YYYY-MM */
  private addMonths(yearMonth: string, n: number): string {
    const [y, m] = yearMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + n, 1);
    return this.toYearMonth(date);
  }

  private toYearMonth(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  /**
   * Returns a summary of upcoming recurring transactions for the
   * current month — used by the dashboard banner.
   */
  async getRecurringSummary(userId: string): Promise<{
    expenses: Array<{ id: string; name: string; amount: number; type: string }>;
    income: Array<{ id: string; name: string; amount: number; type: string }>;
  }> {
    const [expenseTemplates, incomeTemplates] = await Promise.all([
      this.expenseRepository.find({
        where: { userId, isRecurring: true, recurringParentId: null } as any,
      }),
      this.incomeRepository.find({
        where: { userId, isRecurring: true, recurringParentId: null } as any,
      }),
    ]);

    return {
      expenses: expenseTemplates.map((e) => ({
        id: e.id,
        name: e.name,
        amount: Number(e.amount),
        type: e.type,
      })),
      income: incomeTemplates.map((i) => ({
        id: i.id,
        name: i.name,
        amount: Number(i.amount),
        type: i.type,
      })),
    };
  }
}