import { ExpenseStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class FixedExpenseDto {
  @IsString() @MinLength(2) name: string;
  @IsUUID() categoryId: string;
  @Type(() => Number) @IsNumber() @Min(0.01) expectedAmount: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(31) dueDay: number;
  @IsEnum(ExpenseStatus) status: ExpenseStatus;
  @Type(() => Date) @IsDate() month: Date;
  @IsOptional() @IsString() notes?: string;
}
