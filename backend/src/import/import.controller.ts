import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportCsvDto } from './dto/create-import.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('csv')
  importCsv(@CurrentUser() user: AuthUser, @Body() dto: ImportCsvDto) {
    return this.importService.importCsv(user.id, dto);
  }
}