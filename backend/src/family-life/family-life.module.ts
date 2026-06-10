import { Module } from '@nestjs/common';
import { FamilyLifeController } from './family-life.controller';

@Module({ controllers: [FamilyLifeController] })
export class FamilyLifeModule {}
