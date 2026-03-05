import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { LedgerService } from "./ledger.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../auth/decorators/current-user.decorator";

@Controller("ledger")
@UseGuards(JwtAuthGuard)
export class LedgerController {
    constructor(private readonly ledgerService: LedgerService) {}

    @Get()
    async getLedger(
        @CurrentUser() user: AuthUser,
        @Query("month") month?: string,
        @Query("year") year?: string,
        @Query("startDate") startDate?: string,
        @Query("endDate") endDate?: string,
        @Query("kind") kind?: "income" | "expense",
        @Query("type") type?: string,
        @Query("q") q?: string,
        @Query("minAmount") minAmount?: string,
        @Query("maxAmount") maxAmount?: string,
        @Query("sort") sort?: "date" | "amount",
        @Query("order") order?: "ASC" | "DESC",
        @Query("limit") limit?: string,
    ) {
        return this.ledgerService.getLedger({
            userId: user.id,
            month: month ? parseInt(month, 10) : undefined,
            year: year ? parseInt(year, 10) : undefined,
            startDate,
            endDate,
            kind,
            type,
            q,
            minAmount: minAmount ? Number(minAmount) : undefined,
            maxAmount: maxAmount ? Number(maxAmount) : undefined,
            sort,
            order,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
}