import { SavingsGoalType, SavingsMovementType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class SavingsGoalDto {
  @IsString() @MinLength(2) name: string;
  @Type(() => Number) @IsNumber() @Min(0.01) targetAmount: number;
  @IsOptional() @Type(() => Date) @IsDate() deadline?: Date;
  @IsEnum(SavingsGoalType) type: SavingsGoalType;
}
export class SavingsMovementDto {
  @IsEnum(SavingsMovementType) type: SavingsMovementType;
  @Type(() => Number) @IsNumber() @Min(0.01) amount: number;
  @Type(() => Date) @IsDate() date: Date;
  @IsOptional() @IsString() notes?: string;
}
