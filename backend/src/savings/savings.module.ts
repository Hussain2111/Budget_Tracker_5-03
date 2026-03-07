import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsService } from './savings.service';
import { SavingsController } from './savings.controller';
import { Saving } from './entities/saving.entity';
import { Contribution } from './entities/contribution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Saving, Contribution])],
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
