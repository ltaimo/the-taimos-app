import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { RecurringTransactionsModule } from '../recurring-transactions/recurring-transactions.module';
@Module({ imports: [RecurringTransactionsModule], controllers: [ReportsController] })
export class ReportsModule {}
