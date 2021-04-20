import { RecurringEventInsertDto } from './../dto/recurring-event-insert-dto';
import { SimpleEventInsertDto } from './../dto/simple-event-insert.dto';
import { RecurringEvents, Ranges } from './../../entites/recurringEvents.entity';
import { SimpleEvents } from './../../entites/simpleEvents.entity';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult, Between, } from 'typeorm';
import { User } from 'src/entites/user.entity';
import { Company } from 'src/entites/company.entity';
import { EventDateChanges } from 'src/entites/eventDateChanges.entity';

@Injectable()
export class CalenderService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Company)
        private companyRepository: Repository<Company>,
        @InjectRepository(SimpleEvents)
        private simpleEventRepository: Repository<SimpleEvents>,
        @InjectRepository(EventDateChanges)
        private eventdateChangesRepository: Repository<EventDateChanges>,
        @InjectRepository(RecurringEvents)
        private recurringEventRepository: Repository<RecurringEvents>
    ) { }

    public async addSimpleEvent(simpleEventDto: SimpleEventInsertDto): Promise<SimpleEvents> {
        let company: Company = null, user: User = null;
        if (!simpleEventDto.companyId && !simpleEventDto.userId) {
            throw new BadRequestException("One of them need to be");
        }
        if (simpleEventDto.companyId) {
            company = await this.companyRepository.findOne({ id: simpleEventDto.companyId });
        }
        if (simpleEventDto.userId) {
            user = await this.userRepository.findOne({ id: simpleEventDto.userId });
        }
        const insertEvent = {
            ...simpleEventDto,
            company,
            user
        }

        return await this.simpleEventRepository.create(insertEvent);
    }
    public async changeSimpleEventDate(simpleEventId: number, newDate: Date): Promise<void> {
        const result: UpdateResult = await this.simpleEventRepository.update({ originalDate: newDate }, { id: simpleEventId });
        if (!result.affected) {
            throw new NotFoundException("Simple event not found");
        }
    }
    public async addRecurringEvent(reccurringDto: RecurringEventInsertDto): Promise<RecurringEvents> {
        let company: Company = null, user: User = null;
        if (!reccurringDto.companyId && !reccurringDto.userId) {
            throw new BadRequestException("One of them need to be");
        }
        if (reccurringDto.companyId) {
            company = await this.companyRepository.findOne({ id: reccurringDto.companyId });
        }
        if (reccurringDto.userId) {
            user = await this.userRepository.findOne({ id: reccurringDto.userId });
        }
        const insertEvent = {
            ...reccurringDto,
            company,
            user
        }

        return await this.recurringEventRepository.create(insertEvent);
    }
    private checkIfDateInRange(recurring: RecurringEvents, dateToCompare: Date): boolean {
        let year: number = 2023;
        let date: Date = recurring.firstDate;
        if (recurring.range === Ranges.Monthly) {
            year = 2024;
            while (date.getFullYear() < year) {
                if (date === dateToCompare) {
                    return true;
                }
                date.setMonth(date.getMonth() + 1);
            }
            return false;
        }
        while (date.getFullYear() < year) {
            if (date === dateToCompare) {
                return true;
            }
            date.setDate(date.getDate() + recurring.range);
        }
        return false;
    }
    public async changeDateOfRecurringInstance(recurringId: number, date: Date, newDate: Date): Promise<EventDateChanges> {
        const recurringEvent: RecurringEvents = await this.recurringEventRepository.findOne({ id: recurringId });
        if (!recurringEvent) {
            throw new NotFoundException("Recurring Event not found");
        }
        if (!this.checkIfDateInRange(recurringEvent, date)) {
            throw new BadRequestException("date is not in range");
        }
        return await this.eventdateChangesRepository.create({
            replacedDate: newDate,
            originalDate: date,
            recurringEvent
        });
    }

    public async cancelRecurringEventInstance(recurringId: number, dateInstance: Date): Promise<EventDateChanges> {
        const recurringEvent: RecurringEvents = await this.recurringEventRepository.findOne({ id: recurringId });
        if (!recurringEvent) {
            throw new NotFoundException("Recurring Event not found");
        }
        if (!this.checkIfDateInRange(recurringEvent, dateInstance)) {
            throw new BadRequestException("date is not in range");
        }
        return await this.eventdateChangesRepository.create({
            recurringEvent,
            originalDate: dateInstance,
            isCanceled: true
        });
    }

    public async getAllEventsInEachTime(startDate: Date, endDate: Date): Promise<(RecurringEvents | SimpleEvents)[]> {
        const arrayResult: (RecurringEvents | SimpleEvents)[] = [];
        const simpleEvents: SimpleEvents[] = await this.simpleEventRepository.find({
            where: { originalDate: Between(startDate, endDate) }
        });
        arrayResult.concat(simpleEvents);
        const recurringEvents: RecurringEvents[] = await this.recurringEventRepository.find({});
        //const extras = await this.eventdateChangesRepository.find();
        recurringEvents.forEach(recurringEvent => {
/*             const instances:EventDateChanges[] = await this.eventdateChangesRepository.find({ recurringEvent });
            if (instances) {
                Check Instances to replacing
            } */
            if (this.checkIfDateInRange(recurringEvent, startDate) || this.checkIfDateInRange(recurringEvent, endDate)) {
                arrayResult.push(recurringEvent);
            }

        });
        return arrayResult;
    }

}
