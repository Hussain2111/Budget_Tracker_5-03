import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { ContributeSavingDto } from './dto/contribute-saving.dto';
import { Saving } from './entities/saving.entity';
import { Contribution } from './entities/contribution.entity';

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(Saving)
    private readonly savingRepository: Repository<Saving>,
    @InjectRepository(Contribution)
    private readonly contributionRepository: Repository<Contribution>,
  ) {}

  async create(createSavingDto: CreateSavingDto, userId: string) {
    if (!createSavingDto.name || !createSavingDto.targetAmount || !createSavingDto.deadline) {
      throw new BadRequestException('Missing required fields: name, targetAmount, deadline');
    }

    const saving = this.savingRepository.create({
      ...createSavingDto,
      userId,
    });

    return await this.savingRepository.save(saving);
  }

  async findAll(userId: string) {
    return await this.savingRepository.find({
      where: { userId },
      order: { deadline: 'ASC' },
    });
  }

  async findOne(id: string, userId: string) {
    const saving = await this.savingRepository.findOne({
      where: { id, userId },
    });

    if (!saving) {
      throw new NotFoundException(`Saving with ID ${id} not found`);
    }

    return saving;
  }

  async update(id: string, updateSavingDto: UpdateSavingDto, userId: string) {
    const saving = await this.findOne(id, userId);

    const updatedSaving = Object.assign(saving, updateSavingDto);
    return await this.savingRepository.save(updatedSaving);
  }

  async remove(id: string, userId: string) {
    const saving = await this.findOne(id, userId);
    return await this.savingRepository.remove(saving);
  }

  async contribute(id: string, contributeSavingDto: ContributeSavingDto, userId: string) {
    const saving = await this.findOne(id, userId);

    if (contributeSavingDto.amount <= 0) {
      throw new BadRequestException('Contribution amount must be greater than 0');
    }

    const newAmount = parseFloat(saving.currentAmount.toString()) + contributeSavingDto.amount;
    const cappedAmount = Math.min(newAmount, parseFloat(saving.targetAmount.toString()));

    saving.currentAmount = cappedAmount;
    await this.savingRepository.save(saving);

    // Record the contribution separately
    const contribution = this.contributionRepository.create({
      savingId: id,
      userId,
      amount: contributeSavingDto.amount,
      note: contributeSavingDto.note,
      date: contributeSavingDto.date
        ? contributeSavingDto.date.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });

    await this.contributionRepository.save(contribution);

    return saving;
  }

  async getContributions(id: string, userId: string) {
    await this.findOne(id, userId); // verifies ownership

    return this.contributionRepository.find({
      where: { savingId: id, userId },
      order: { createdAt: 'DESC' },
    });
  }
}
