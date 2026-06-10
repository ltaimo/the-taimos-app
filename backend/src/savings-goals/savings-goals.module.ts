import { Module } from '@nestjs/common';
import { SavingsGoalsController } from './savings-goals.controller';
@Module({ controllers: [SavingsGoalsController] })
export class SavingsGoalsModule {}
