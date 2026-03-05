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
import { IncomeService } from "./income.service";
import { CreateIncomeDto } from "./dto/create-income.dto";
import { UpdateIncomeDto } from "./dto/update-income.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../auth/decorators/current-user.decorator";

@Controller("income")
@UseGuards(JwtAuthGuard)
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  create(@Body() createIncomeDto: CreateIncomeDto, @CurrentUser() user: AuthUser) {
    return this.incomeService.create(createIncomeDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.incomeService.findAll(user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.incomeService.findOne(id, user.id);
  }

  @Patch(":id")
  update(
      @Param("id") id: string,
      @Body() updateIncomeDto: UpdateIncomeDto,
      @CurrentUser() user: AuthUser,
  ) {
    return this.incomeService.update(id, updateIncomeDto, user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.incomeService.remove(id, user.id);
  }
}