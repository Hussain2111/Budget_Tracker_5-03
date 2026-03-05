import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Income } from '../income/entities/income.entity';
import { Saving } from '../savings/entities/saving.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Income, Saving])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
