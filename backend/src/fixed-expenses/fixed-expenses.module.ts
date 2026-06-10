import { Module } from '@nestjs/common';
import { FixedExpensesController } from './fixed-expenses.controller';
@Module({ controllers: [FixedExpensesController] })
export class FixedExpensesModule {}
