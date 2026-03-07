import { IsNumber, IsOptional, IsString, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ContributeSavingDto {
  @IsNumber()
  @Min(0.01, { message: 'Contribution must be greater than $0' })
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;
}
