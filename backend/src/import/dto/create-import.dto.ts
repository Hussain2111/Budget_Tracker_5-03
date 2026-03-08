import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsIn,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CsvRowDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  description?: string;
}

export class ImportCsvDto {
  @IsIn(['expense', 'income'])
  kind: 'expense' | 'income';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CsvRowDto)
  rows: CsvRowDto[];
}