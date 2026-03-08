import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecurringService } from './recurring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';

@Controller('recurring')
@UseGuards(JwtAuthGuard)
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  /**
   * Returns the list of active recurring templates for the dashboard banner.
   * The auto-generation itself happens at login via AuthService.
   */
  @Get('summary')
  getSummary(@CurrentUser() user: AuthUser) {
    return this.recurringService.getRecurringSummary(user.id);
  }
}