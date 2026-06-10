import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class BootstrapDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() @MinLength(2) householdName?: string;
  @IsOptional() @IsString() @Length(8, 8) inviteCode?: string;
}
