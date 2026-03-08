import { PartialType } from '@nestjs/mapped-types';
import { ImportCsvDto } from './create-import.dto';

export class UpdateImportDto extends PartialType(ImportCsvDto) {}
