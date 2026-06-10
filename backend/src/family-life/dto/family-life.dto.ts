import { ItemStatus, Priority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength,
} from 'class-validator';

export class ReminderDto {
  @IsString() @MinLength(2) title: string;
  @IsOptional() @IsString() description?: string;
  @Type(() => Date) @IsDate() dueAt: Date;
  @IsEnum(Priority) priority: Priority;
  @IsOptional() @IsEnum(ItemStatus) status?: ItemStatus;
  @IsOptional() @IsUUID() assigneeId?: string;
}

export class ShoppingItemDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() store?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) estimatedPrice?: number;
  @IsOptional() @Type(() => Date) @IsDate() neededBy?: Date;
  @IsEnum(Priority) priority: Priority;
  @IsOptional() @IsEnum(ItemStatus) status?: ItemStatus;
  @IsOptional() @IsUUID() assigneeId?: string;
}

export class FamilyEventDto {
  @IsString() @MinLength(2) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() host?: string;
  @Type(() => Date) @IsDate() startsAt: Date;
  @IsOptional() @Type(() => Date) @IsDate() endsAt?: Date;
  @IsOptional() @Type(() => Date) @IsDate() reminderAt?: Date;
  @IsOptional() @IsEnum(ItemStatus) status?: ItemStatus;
}
