import { TransactionNature, TransactionType } from '@prisma/client';
import { IsEnum, IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';

export class CategoryDto {
  @IsString() @MinLength(2) name: string;
  @IsEnum(TransactionType) type: TransactionType;
  @IsOptional() @IsEnum(TransactionNature) nature?: TransactionNature;
  @IsOptional() @IsHexColor() color?: string;
}
