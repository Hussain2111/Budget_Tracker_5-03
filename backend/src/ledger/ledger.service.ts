import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Income } from '../income/entities/income.entity';

type LedgerKind = 'income' | 'expense';

@Injectable()
export class LedgerService {
    constructor(
        @InjectRepository(Expense)
        private readonly expenseRepository: Repository<Expense>,
        @InjectRepository(Income)
        private readonly incomeRepository: Repository<Income>,
    ) {}

    async getLedger(params: {
        userId: string;
        month?: number;
        year?: number;
        startDate?: string;
        endDate?: string;
        kind?: LedgerKind;
        type?: string;
        q?: string;
        minAmount?: number;
        maxAmount?: number;
        sort?: 'date' | 'amount';
        order?: 'ASC' | 'DESC';
        limit?: number;
    }) {
        const {
            userId,
            month,
            year,
            startDate,
            endDate,
            kind,
            type,
            q,
            minAmount,
            maxAmount,
            sort = 'date',
            order = 'DESC',
            limit,
        } = params;

        const [expenses, incomes] = await Promise.all([
            kind && kind !== 'expense'
                ? Promise.resolve([])
                : this.expenseRepository.find({ where: { userId } }),
            kind && kind !== 'income'
                ? Promise.resolve([])
                : this.incomeRepository.find({ where: { userId } }),
        ]);

        const toLedgerRow = (row: any, rowKind: LedgerKind) => {
            const amount = Number(row.amount);
            return {
                id: row.id,
                kind: rowKind,
                name: row.name,
                type: row.type,
                amount: rowKind === 'expense' ? -amount : amount, // signed
                date: row.date,
                description: row.description,
                createdAt: row.createdAt,
            };
        };

        let combined = [
            ...expenses.map((e) => toLedgerRow(e, 'expense')),
            ...incomes.map((i) => toLedgerRow(i, 'income')),
        ];


        if (month && year) {
            combined = combined.filter((tx) => {
                const d = new Date(tx.date);
                return d.getFullYear() === year && d.getMonth() === month - 1;
            });
        }

        if (startDate) {
            const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
            combined = combined.filter((tx) => new Date(tx.date).getTime() >= start);
        }
        if (endDate) {
            const end = new Date(`${endDate}T23:59:59.999Z`).getTime();
            combined = combined.filter((tx) => new Date(tx.date).getTime() <= end);
        }

        if (type) {
            combined = combined.filter((tx) => tx.type === type);
        }

        if (q && q.trim()) {
            const needle = q.trim().toLowerCase();
            combined = combined.filter((tx) => {
                const hay = `${tx.name ?? ''} ${tx.type ?? ''} ${tx.description ?? ''}`.toLowerCase();
                return hay.includes(needle);
            });
        }

        if (typeof minAmount === 'number' && !Number.isNaN(minAmount)) {
            combined = combined.filter((tx) => Math.abs(Number(tx.amount)) >= minAmount);
        }
        if (typeof maxAmount === 'number' && !Number.isNaN(maxAmount)) {
            combined = combined.filter((tx) => Math.abs(Number(tx.amount)) <= maxAmount);
        }

        combined.sort((a, b) => {
            if (sort === 'amount') {
                return order === 'ASC' ? a.amount - b.amount : b.amount - a.amount;
            }
            const ad = new Date(a.date).getTime();
            const bd = new Date(b.date).getTime();
            return order === 'ASC' ? ad - bd : bd - ad;
        });

        if (limit && limit > 0) {
            combined = combined.slice(0, limit);
        }

        return combined;
    }
}