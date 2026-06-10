import { Module } from '@nestjs/common';
import { HouseholdsController } from './households.controller';
@Module({ controllers: [HouseholdsController] })
export class HouseholdsModule {}
