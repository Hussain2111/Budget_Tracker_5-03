import {
    Controller, Get, Post, Delete,
    Param, Body, Query, UseGuards,
} from "@nestjs/common";
import { BudgetService } from "./budget.service";
import { UpsertBudgetDto } from "./dto/upsert-budget.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../auth/decorators/current-user.decorator";

@Controller("budgets")
@UseGuards(JwtAuthGuard)
export class BudgetController {
    constructor(private readonly budgetService: BudgetService) {}

    @Get()
    getAll(
        @CurrentUser() user: AuthUser,
        @Query("month") month: string,
        @Query("year") year: string,
    ) {
        return this.budgetService.getAll(
            user.id,
            parseInt(month, 10),
            parseInt(year, 10),
        );
    }

    @Post("upsert")
    upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertBudgetDto) {
        return this.budgetService.upsert(user.id, dto);
    }

    @Delete(":id")
    delete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.budgetService.delete(user.id, id);
    }
}
