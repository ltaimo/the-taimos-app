import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsUUID, Min } from 'class-validator';
export class BudgetDto {
  @IsUUID() categoryId: string;
  @Type(() => Date) @IsDate() month: Date;
  @Type(() => Number) @IsNumber() @Min(0.01) amount: number;
}
