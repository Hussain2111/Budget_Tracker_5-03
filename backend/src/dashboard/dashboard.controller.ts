import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  type AuthUser,
} from "../auth/decorators/current-user.decorator";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  async getSummary(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getDashboardSummary(user.id);
  }

  @Get("monthly-summary")
  async getMonthlySummary(
      @CurrentUser() user: AuthUser,
      @Query("month") month: string,
      @Query("year") year: string,
  ) {
    return this.dashboardService.getMonthlySummary(
        user.id,
        parseInt(month, 10),
        parseInt(year, 10),
    );
  }

  @Get("monthly-history")
  async getMonthlyHistory(
      @CurrentUser() user: AuthUser,
      @Query("months") months?: string,
  ) {
    return this.dashboardService.getMonthlyHistory(
        user.id,
        months ? parseInt(months, 10) : 12,
    );
  }

  @Get("expenses-by-category")
  async getExpensesByCategory(
      @CurrentUser() user: AuthUser,
      @Query("month") month?: string,
      @Query("year") year?: string,
  ) {
    return this.dashboardService.getExpensesByCategory(
        user.id,
        month ? parseInt(month, 10) : undefined,
        year ? parseInt(year, 10) : undefined,
    );
  }

  @Get("income-by-category")
  async getIncomeByCategory(
      @CurrentUser() user: AuthUser,
      @Query("month") month?: string,
      @Query("year") year?: string,
  ) {
    return this.dashboardService.getIncomeByCategory(
        user.id,
        month ? parseInt(month, 10) : undefined,
        year ? parseInt(year, 10) : undefined,
    );
  }
}