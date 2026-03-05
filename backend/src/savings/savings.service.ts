import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { Saving } from './entities/saving.entity';

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(Saving)
    private readonly savingRepository: Repository<Saving>,
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
}
