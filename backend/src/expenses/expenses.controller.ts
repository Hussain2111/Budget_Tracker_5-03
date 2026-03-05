import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  type AuthUser,
} from "../auth/decorators/current-user.decorator";

@Controller("expenses")
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.expensesService.create(createExpenseDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.expensesService.findAll(user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.expensesService.findOne(id, user.id);
  }

  @Patch(":id")
  update(
      @Param("id") id: string,
      @Body() updateExpenseDto: UpdateExpenseDto,
      @CurrentUser() user: AuthUser,
  ) {
    return this.expensesService.update(id, updateExpenseDto, user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.expensesService.remove(id, user.id);
  }
}