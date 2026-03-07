import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BudgetController } from "./budget.controller";
import { BudgetService } from "./budget.service";
import { Budget } from "./entities/budget.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [TypeOrmModule.forFeature([Budget]), AuthModule],
    controllers: [BudgetController],
    providers: [BudgetService],
})
export class BudgetModule {}
