import { UserService } from './services/user.service';
import { Module } from '@nestjs/common';
import { CalenderController } from './controller/calender.controller';
import { CalenderService } from './services/calender.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import entites from '../entites';

@Module({
  imports: [TypeOrmModule.forFeature(entites)],
  controllers: [CalenderController],
  providers: [CalenderService, UserService],
  exports: [CalenderService, UserService]
})
export class CalenderModule { }
