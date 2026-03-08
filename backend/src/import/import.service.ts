import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Income } from '../income/entities/income.entity';
import { ImportCsvDto } from './dto/create-import.dto';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
  ) {}

  async importCsv(
    userId: string,
    dto: ImportCsvDto,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const { kind, rows } = dto;

    if (!rows || rows.length === 0) {
      throw new BadRequestException('No rows provided');
    }

    if (rows.length > 500) {
      throw new BadRequestException('Maximum 500 rows per import');
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Basic validation
        if (!row.name?.trim()) {
          errors.push(`Row ${i + 1}: name is required`);
          skipped++;
          continue;
        }
        if (!row.amount || Number(row.amount) <= 0) {
          errors.push(`Row ${i + 1}: amount must be greater than 0`);
          skipped++;
          continue;
        }
        if (!row.date || isNaN(Date.parse(row.date))) {
          errors.push(`Row ${i + 1}: invalid date "${row.date}"`);
          skipped++;
          continue;
        }

        if (kind === 'expense') {
          const entity = this.expenseRepository.create({
            userId,
            name: row.name.trim(),
            type: row.type?.trim() || 'Other',
            amount: Number(row.amount),
            date: new Date(row.date),
            description: row.description?.trim(),
          });
          await this.expenseRepository.save(entity);
        } else {
          const entity = this.incomeRepository.create({
            userId,
            name: row.name.trim(),
            type: row.type?.trim() || 'Other',
            amount: Number(row.amount),
            date: new Date(row.date),
            description: row.description?.trim(),
          });
          await this.incomeRepository.save(entity);
        }

        imported++;
      } catch (err) {
        errors.push(`Row ${i + 1}: unexpected error — ${err.message}`);
        skipped++;
      }
    }

    return { imported, skipped, errors };
  }
}