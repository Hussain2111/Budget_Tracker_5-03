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
import { SavingsService } from "./savings.service";
import { CreateSavingDto } from "./dto/create-saving.dto";
import { UpdateSavingDto } from "./dto/update-saving.dto";
import { ContributeSavingDto } from "./dto/contribute-saving.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../auth/decorators/current-user.decorator";

@Controller("savings")
@UseGuards(JwtAuthGuard)
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Post()
  create(@Body() createSavingDto: CreateSavingDto, @CurrentUser() user: AuthUser) {
    return this.savingsService.create(createSavingDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.savingsService.findAll(user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.savingsService.findOne(id, user.id);
  }

  @Patch(":id")
  update(
      @Param("id") id: string,
      @Body() updateSavingDto: UpdateSavingDto,
      @CurrentUser() user: AuthUser,
  ) {
    return this.savingsService.update(id, updateSavingDto, user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.savingsService.remove(id, user.id);
  }

  @Post(":id/contribute")
  contribute(
      @Param("id") id: string,
      @Body() contributeSavingDto: ContributeSavingDto,
      @CurrentUser() user: AuthUser,
  ) {
    return this.savingsService.contribute(id, contributeSavingDto, user.id);
  }

  @Get(":id/contributions")
  getContributions(
      @Param("id") id: string,
      @CurrentUser() user: AuthUser,
  ) {
    return this.savingsService.getContributions(id, user.id);
  }
}