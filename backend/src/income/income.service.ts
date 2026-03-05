import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { Income } from './entities/income.entity';

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
  ) {}

  async create(createIncomeDto: CreateIncomeDto, userId: string) {
    if (!createIncomeDto.name || !createIncomeDto.amount || !createIncomeDto.date) {
      throw new BadRequestException('Missing required fields: name, amount, date');
    }

    const income = this.incomeRepository.create({
      ...createIncomeDto,
      userId,
    });

    return await this.incomeRepository.save(income);
  }

  async findAll(userId: string) {
    return await this.incomeRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const income = await this.incomeRepository.findOne({
      where: { id, userId },
    });

    if (!income) {
      throw new NotFoundException(`Income with ID ${id} not found`);
    }

    return income;
  }

  async update(id: string, updateIncomeDto: UpdateIncomeDto, userId: string) {
    const income = await this.findOne(id, userId);

    const updatedIncome = Object.assign(income, updateIncomeDto);
    return await this.incomeRepository.save(updatedIncome);
  }

  async remove(id: string, userId: string) {
    const income = await this.findOne(id, userId);
    await this.incomeRepository.delete(id);
    return { message: 'Income deleted successfully', id };
  }
}

