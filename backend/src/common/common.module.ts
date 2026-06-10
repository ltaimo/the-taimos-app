import { Global, Module } from '@nestjs/common';
import { HouseholdContextService } from './household.service';

@Global()
@Module({ providers: [HouseholdContextService], exports: [HouseholdContextService] })
export class CommonModule {}
