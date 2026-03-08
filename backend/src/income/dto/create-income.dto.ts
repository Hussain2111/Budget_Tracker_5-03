import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIncomeDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsIn(['monthly'])
  recurringFrequency?: string;
}