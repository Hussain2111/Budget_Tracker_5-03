import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { Expense } from '../expenses/entities/expense.entity';
import { Income } from '../income/entities/income.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Expense, Income])],
    controllers: [LedgerController],
    providers: [LedgerService],
})
export class LedgerModule {}