import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IncomeModule } from './income/income.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LedgerModule } from './ledger/ledger.module';
import { SavingsModule } from './savings/savings.module';
import { BudgetModule } from './budget/budget.module';
import { RecurringModule } from './recurring/recurring.module';
import { ImportModule } from './import/import.module';

import { User } from './auth/entities/user.entity';
import { Expense } from './expenses/entities/expense.entity';
import { Income } from './income/entities/income.entity';
import { Saving } from './savings/entities/saving.entity';
import { Contribution } from './savings/entities/contribution.entity';
import { Budget } from './budget/entities/budget.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Expense, Income, Saving, Contribution, Budget],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}),
    ExpensesModule,
    IncomeModule,
    AuthModule,
    SavingsModule,
    DashboardModule,
    LedgerModule,
    BudgetModule,
    RecurringModule,
    ImportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}