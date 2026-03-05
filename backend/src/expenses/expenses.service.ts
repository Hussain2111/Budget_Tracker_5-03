import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, userId: string) {
    if (!createExpenseDto.name || !createExpenseDto.amount || !createExpenseDto.date) {
      throw new BadRequestException('Missing required fields: name, amount, date');
    }

    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      userId,
    });

    return await this.expenseRepository.save(expense);
  }

  async findAll(userId: string) {
    return await this.expenseRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const expense = await this.expenseRepository.findOne({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, userId: string) {
    const expense = await this.findOne(id, userId);

    const updatedExpense = Object.assign(expense, updateExpenseDto);
    return await this.expenseRepository.save(updatedExpense);
  }

  async remove(id: string, userId: string) {
    const expense = await this.findOne(id, userId);
    await this.expenseRepository.delete(id);
    return { message: 'Expense deleted successfully', id };
  }
}

