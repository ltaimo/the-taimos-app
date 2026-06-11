import { PaymentMethod, TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean, IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength,
} from 'class-validator';

export class RecurringTransactionDto {
  @IsString() @MinLength(2) name: string;
  @IsEnum(TransactionType) type: TransactionType;
  @IsUUID() categoryId: string;
  @IsUUID() responsibleId: string;
  @Type(() => Number) @IsNumber() @Min(0.01) amount: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(31) dayOfMonth: number;
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
  @Type(() => Date) @IsDate() startMonth: Date;
  @IsOptional() @Type(() => Date) @IsDate() endMonth?: Date;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
