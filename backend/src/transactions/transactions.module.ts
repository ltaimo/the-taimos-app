import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { RecurringTransactionsModule } from '../recurring-transactions/recurring-transactions.module';
@Module({ imports: [RecurringTransactionsModule], controllers: [TransactionsController] })
export class TransactionsModule {}
