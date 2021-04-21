import { RecurringEventInsertDto } from './../dto/recurring-event-insert-dto'
import { SimpleEventInsertDto } from './../dto/simple-event-insert.dto'
import { RecurringEvents, Ranges } from './../../entites/recurringEvents.entity'
import { SimpleEvents } from './../../entites/simpleEvents.entity'
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, UpdateResult, Between } from 'typeorm'
import { User } from 'src/entites/user.entity'
import { Company } from 'src/entites/company.entity'
import { EventDateChanges } from 'src/entites/eventDateChanges.entity'
import * as async from 'async'
import { RecurringEventDetails } from '../interfaces'


enum Errors{
    SIMPLE_INPUT_MESSAGE="One of them need to be",
    SIMPLE_EVENT_NOT_FOUND= "Simple event not found",
    RECURRRING_ERROR_INPUT_MESSAGE= "One of them need to be",
    RECURRING_NOT_FOUND="Recurring Event not found",
    DATE_NOT_IN_RANGE= "Date is not in range"
}
@Injectable()
export class CalenderService {
  constructor (
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(SimpleEvents)
    private simpleEventRepository: Repository<SimpleEvents>,
    @InjectRepository(EventDateChanges)
    private eventdateChangesRepository: Repository<EventDateChanges>,
    @InjectRepository(RecurringEvents)
    private recurringEventRepository: Repository<RecurringEvents>,
  ) {}

  public async addSimpleEvent ( simpleEventDto: SimpleEventInsertDto): Promise<SimpleEvents> {
    let company: Company = null,
      user: User = null
    if (!simpleEventDto.companyId && !simpleEventDto.userId) {
      throw new BadRequestException(Errors.SIMPLE_INPUT_MESSAGE)
    }
    if (simpleEventDto.companyId) {
      company = await this.companyRepository.findOne({
        id: simpleEventDto.companyId,
      })
    }
    if (simpleEventDto.userId) {
      user = await this.userRepository.findOne({ id: simpleEventDto.userId })
    }
    const insertEvent = {
      ...simpleEventDto,
      company,
      user,
    }

    return await this.simpleEventRepository.create(insertEvent)
  }
  public async changeSimpleEventDate (
    simpleEventId: number,
    newDate: Date,
  ): Promise<void> {
    const result: UpdateResult = await this.simpleEventRepository.update(
      { originalDate: newDate },
      { id: simpleEventId },
    )
    if (!result.affected) {
      throw new NotFoundException(Errors.SIMPLE_EVENT_NOT_FOUND)
    }
  }


  public async addRecurringEvent (reccurringDto: RecurringEventInsertDto): Promise<RecurringEvents> {
    let company: Company = null,user: User = null;

    if (!reccurringDto.companyId && !reccurringDto.userId) {
      throw new BadRequestException(Errors.RECURRRING_ERROR_INPUT_MESSAGE)
    }

    if (reccurringDto.companyId) {
      company = await this.companyRepository.findOne({id: reccurringDto.companyId})
    }
    if (reccurringDto.userId) {
      user = await this.userRepository.findOne({ id: reccurringDto.userId })
    }

    const insertEvent = {
      ...reccurringDto,
      company,
      user,
    }

    return await this.recurringEventRepository.create(insertEvent)
  }


  private checkIfDateInRange ( recurring: RecurringEvents,dateToCompare: Date): boolean {
    let year: number = 2023
    let date: Date = recurring.firstDate
    if (recurring.range === Ranges.Monthly) {
      year = 2024
      while (date.getFullYear() < year) {
        if (date === dateToCompare) {
          return true
        }
        date.setMonth(date.getMonth() + 1)
      }
      return false
    }
    while (date.getFullYear() < year) {
      if (date === dateToCompare) {
        return true
      }
      date.setDate(date.getDate() + recurring.range)
    }
    return false
  }


  public async changeDateOfRecurringInstance(recurringId: number, date: Date, newDate: Date): Promise<EventDateChanges> {
    
    const recurringEvent: RecurringEvents = await this.recurringEventRepository.findOne({ id: recurringId });

    if (!recurringEvent) {
      throw new NotFoundException(Errors.RECURRING_NOT_FOUND)
    }
    if (!this.checkIfDateInRange(recurringEvent, date)) {
      throw new BadRequestException(Errors.DATE_NOT_IN_RANGE)
    }
    return await this.eventdateChangesRepository.create({
      replacedDate: newDate,
      originalDate: date,
      recurringEvent,
    })
  }

  public async cancelRecurringEventInstance (recurringId: number, dateInstance: Date): Promise<EventDateChanges> {
    const recurringEvent: RecurringEvents = await this.recurringEventRepository.findOne({ id: recurringId })
    if (!recurringEvent) {
      throw new NotFoundException(Errors.RECURRING_NOT_FOUND)
    }
    if (!this.checkIfDateInRange(recurringEvent, dateInstance)) {
      throw new BadRequestException(Errors.DATE_NOT_IN_RANGE)
    }
    return await this.eventdateChangesRepository.create({
      recurringEvent,
      originalDate: dateInstance,
      isCanceled: true,
    })
  }


  private checkIfRecurringEventIsRange(eventCondition:EventDateChanges,dateToCheck:Date, startDate: Date,endDate: Date){
    
    if (eventCondition.originalDate === dateToCheck && !eventCondition.isCanceled) {
        if (eventCondition.replacedDate) {
          if (eventCondition.replacedDate >= startDate && eventCondition.replacedDate <= endDate) {
             return true;
          }
        }
    }

    if ( dateToCheck >= startDate && dateToCheck <= endDate) {
        return true;
    }
    
    return false;
  }

  private async buildRecurringEventArray ( recurringEvent: RecurringEvents, startDate: Date, endDate: Date) {
    const year = 2024;

    let recurringDetails: RecurringEventDetails = {
      date: new Date(),
      description: recurringEvent.description,
      company: recurringEvent.company,
      user: recurringEvent.user,
      startHour: recurringEvent.startHour,
      eventTime: recurringEvent.eventTime,
      title: recurringEvent.title,
    }

    const array: RecurringEventDetails[] = [];
    const specialChangesCancelations: EventDateChanges[] = await this.eventdateChangesRepository.find({ where: { recurringEvent } })

    if (recurringEvent.firstDate >= startDate && recurringEvent.firstDate <= endDate) {
      recurringDetails = { ...recurringDetails, date: recurringEvent.firstDate }
      array.push(recurringDetails)
    }

    specialChangesCancelations.forEach(special => {
      let date: Date = recurringEvent.firstDate;
      if (recurringEvent.range === Ranges.Monthly) {
       
        while (date.getFullYear() < year) {
            if(this.checkIfRecurringEventIsRange(special,date,startDate,endDate)){
                recurringDetails = {
                    ...recurringDetails,
                    date: special.replacedDate? special.replacedDate: date,
                  }
                  array.push(recurringDetails);
            }

          date.setMonth(date.getMonth() + 1)
        }
        return false
      }
      while (date.getFullYear() < year) {

        if(this.checkIfRecurringEventIsRange(special,date,startDate,endDate)){
            recurringDetails = {
                ...recurringDetails,
                date: special.replacedDate? special.replacedDate: date,
              }
              array.push(recurringDetails);
        }
        date.setDate(date.getDate() + recurringEvent.range);

      }
    })
    return array;
  }

  public async getAllEventsInEachTime ( startDate: Date, endDate: Date): Promise<(RecurringEventDetails | SimpleEvents)[]> {
    let allEvents: (RecurringEventDetails | SimpleEvents)[] = []
    const simpleEvents: SimpleEvents[] = await this.simpleEventRepository.find({ where: { originalDate: Between(startDate, endDate) }})
    allEvents=allEvents.concat(simpleEvents);

    const recurringEvents: RecurringEvents[] = await this.recurringEventRepository.find({})
    await async.each(recurringEvents, async recurringEvent=>{
        const resultAcurring= await this.buildRecurringEventArray(recurringEvent,startDate,endDate);
        allEvents=allEvents.concat(resultAcurring);
    });
    
    return allEvents
  }
}
