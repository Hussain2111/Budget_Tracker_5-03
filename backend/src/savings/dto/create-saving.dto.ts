import { IsString, IsNumber, IsDate, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSavingDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  targetAmount: number;

  @IsDate()
  @Type(() => Date)
  deadline: Date;

  @IsOptional()
  @IsString()
  description?: string;
}
