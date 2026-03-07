import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Budget } from "./entities/budget.entity";
import { UpsertBudgetDto } from "./dto/upsert-budget.dto";

@Injectable()
export class BudgetService {
    constructor(
        @InjectRepository(Budget)
        private readonly budgetRepository: Repository<Budget>,
    ) {}

    async getAll(userId: string, month: number, year: number) {
        return this.budgetRepository.find({
            where: { userId, month, year },
        });
    }

    async upsert(userId: string, dto: UpsertBudgetDto) {
        const existing = await this.budgetRepository.findOne({
            where: {
                userId,
                category: dto.category,
                month: dto.month,
                year: dto.year,
            },
        });

        if (existing) {
            existing.amount = dto.amount;
            return this.budgetRepository.save(existing);
        }

        const budget = this.budgetRepository.create({ ...dto, userId });
        return this.budgetRepository.save(budget);
    }

    async delete(userId: string, id: string) {
        await this.budgetRepository.delete({ id, userId });
        return { message: "Budget deleted", id };
    }
}
