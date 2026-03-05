import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IncomeModule } from './income/income.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LedgerModule } from "./ledger/ledger.module";

import { User } from './auth/entities/user.entity';
import { Expense } from './expenses/entities/expense.entity';
import { Income } from './income/entities/income.entity';
import { SavingsModule } from './savings/savings.module';
import { Saving } from './savings/entities/saving.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: (process.env.DB_PORT && parseInt(process.env.DB_PORT, 10)) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'budgettracker',
      entities: [User, Expense, Income, Saving],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    ExpensesModule,
    IncomeModule,
    AuthModule,
    SavingsModule,
    DashboardModule,
    LedgerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
