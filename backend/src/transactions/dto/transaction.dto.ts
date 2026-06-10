import { PaymentMethod, TransactionNature, TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength,
} from 'class-validator';

export class TransactionDto {
  @Type(() => Date) @IsDate() date: Date;
  @IsEnum(TransactionType) type: TransactionType;
  @IsUUID() categoryId: string;
  @IsOptional() @IsString() subcategory?: string;
  @IsString() @MinLength(2) description: string;
  @Type(() => Number) @IsNumber() @Min(0.01) amount: number;
  @IsUUID() responsibleId: string;
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
  @IsEnum(TransactionNature) nature: TransactionNature;
  @IsOptional() @IsString() notes?: string;
}
