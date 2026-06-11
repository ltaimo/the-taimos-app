import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { BudgetsModule } from './budgets/budgets.module';
import { CategoriesModule } from './categories/categories.module';
import { CommonModule } from './common/common.module';
import { FixedExpensesModule } from './fixed-expenses/fixed-expenses.module';
import { HouseholdsModule } from './households/households.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { SavingsGoalsModule } from './savings-goals/savings-goals.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health.controller';
import { FamilyLifeModule } from './family-life/family-life.module';
import { RecurringTransactionsModule } from './recurring-transactions/recurring-transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, CommonModule, AuthModule, UsersModule, HouseholdsModule,
    TransactionsModule, CategoriesModule, FixedExpensesModule, BudgetsModule,
    SavingsGoalsModule, ReportsModule, FamilyLifeModule, RecurringTransactionsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: SupabaseAuthGuard }],
  controllers: [HealthController],
})
export class AppModule {}
