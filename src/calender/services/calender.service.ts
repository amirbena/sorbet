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


enum ClientMessages{
    SIMPLE_INPUT_MESSAGE="One of them need to be",
    SIMPLE_EVENT_NOT_FOUND= "Simple event not found",
    RECURRRING_ERROR_INPUT_MESSAGE= "One of them need to be",
    RECURRING_NOT_FOUND="Recurring Event not found",
    DATE_NOT_IN_RANGE= "Date is not in range",
    CANCELED_RECURRING="Event recurring instance canceled succesfully",
    CHANGED="Event date changed sucessfully",
    COMPANY_NOT_FOUND="Company not found",
    USER_NOT_FOUND="User not found"

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
    let company: Company = null, user: User = null;

    if (simpleEventDto.companyId) {
      company = await this.companyRepository.findOne({ id: simpleEventDto.companyId})
      if (!company) {
        throw new NotFoundException(ClientMessages.COMPANY_NOT_FOUND);
      }
    }

    else if (simpleEventDto.userId) {
      user = await this.userRepository.findOne({ id: simpleEventDto.userId });
      if (!user) {
        throw new NotFoundException(ClientMessages.USER_NOT_FOUND);
      }
    }
 
    else {
        throw new BadRequestException(ClientMessages.SIMPLE_INPUT_MESSAGE)
    }

    const insertEvent = {
      ...simpleEventDto,
      company,
      user,
    }
    delete insertEvent["companyId"];
    delete insertEvent["userId"];

    return await this.simpleEventRepository.create(insertEvent)
  }
  public async changeSimpleEventDate (simpleEventId: number,newDate: Date): Promise<string> {
    const result: UpdateResult = await this.simpleEventRepository.update(
      { originalDate: newDate },
      { id: simpleEventId },
    )
    if (!result.affected) {
      throw new NotFoundException(ClientMessages.SIMPLE_EVENT_NOT_FOUND)
    }
    return ClientMessages.CHANGED;
  }


  public async addRecurringEvent (reccurringDto: RecurringEventInsertDto): Promise<RecurringEvents> {
    let company: Company = null,user: User = null;

    if (reccurringDto.companyId) {
      company = await this.companyRepository.findOne({id: reccurringDto.companyId})
      if (!company) {
          throw new NotFoundException(ClientMessages.COMPANY_NOT_FOUND);
      }
    }

    else if (reccurringDto.userId) {
      user = await this.userRepository.findOne({ id: reccurringDto.userId })
      if (!user) {
         throw new NotFoundException(ClientMessages.USER_NOT_FOUND);
      }
    }

    else{
        throw new BadRequestException(ClientMessages.RECURRRING_ERROR_INPUT_MESSAGE)
    }

    const insertEvent = {
      ...reccurringDto,
      company,
      user,
    }
    delete insertEvent["companyId"];
    delete insertEvent["userId"];

    return await this.recurringEventRepository.create(insertEvent)
  }


  private checkIfDateInRange ( recurring: RecurringEvents,dateToCompare: Date): boolean {
    let year: number = 2023;
    let date: Date = recurring.firstDate;
    if (recurring.range === Ranges.Monthly) {
      year = 2024;
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


  public async changeDateOfRecurringInstance(recurringId: number, date: Date, newDate: Date): Promise<string> {
    const recurringEvent: RecurringEvents = await this.recurringEventRepository.findOne({ id: recurringId });

    if (!recurringEvent) {
      throw new NotFoundException(ClientMessages.RECURRING_NOT_FOUND)
    }

    if (!this.checkIfDateInRange(recurringEvent, date)) {
      throw new BadRequestException(ClientMessages.DATE_NOT_IN_RANGE)
    }

    await this.eventdateChangesRepository.create({
      replacedDate: newDate,
      originalDate: date,
      recurringEvent,
    })
    
    return ClientMessages.CHANGED;
  }

  public async cancelRecurringEventInstance(recurringId: number, dateInstance: Date): Promise<string> {
    const recurringEvent: RecurringEvents = await this.recurringEventRepository.findOne({ id: recurringId })
    
    if (!recurringEvent) {
      throw new NotFoundException(ClientMessages.RECURRING_NOT_FOUND)
    }

    if (!this.checkIfDateInRange(recurringEvent, dateInstance)) {
      throw new BadRequestException(ClientMessages.DATE_NOT_IN_RANGE)
    }

    await this.eventdateChangesRepository.create({
      recurringEvent,
      originalDate: dateInstance,
      isCanceled: true,
    })
    return ClientMessages.CANCELED_RECURRING;
  }


  private checkIfRecurringEventIsRange(eventCondition:EventDateChanges,dateToCheck:Date, startDate: Date,endDate: Date) {
    const dateChecking= eventCondition.originalDate === dateToCheck && !eventCondition.isCanceled && eventCondition.replacedDate ? 
      eventCondition.replacedDate : dateToCheck;

    return dateChecking >= startDate && dateChecking <= endDate;
  }

  private async buildRecurringEventArray(recurringEvent: RecurringEvents, startDate: Date, endDate: Date) {

    const year = endDate.getFullYear();

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
            if(this.checkIfRecurringEventIsRange(special , date ,startDate ,endDate)){
                recurringDetails = {
                    ...recurringDetails,
                    date: special.replacedDate? special.replacedDate: date,
                }

                if(!special.isCanceled) array.push(recurringDetails);
            }

          date.setMonth(date.getMonth() + 1)
        }
        return false
      }
      while (date.getFullYear() < year) {

        if(this.checkIfRecurringEventIsRange(special, date, startDate ,endDate )){
            recurringDetails = {
                ...recurringDetails,
                date: special.replacedDate? special.replacedDate: date,
            }

            if(!special.isCanceled) array.push(recurringDetails);
        }

        date.setDate(date.getDate() + recurringEvent.range);
      }
    })

    return array;
  }

  public async getAllEventsInEachTime ( startDate: Date, endDate: Date): Promise<(RecurringEventDetails | SimpleEvents)[]> {
    let allEvents: (RecurringEventDetails | SimpleEvents)[] = [];
    const simpleEvents: SimpleEvents[] = await this.simpleEventRepository.find({ where: { originalDate: Between(startDate, endDate) }})
    allEvents=allEvents.concat(simpleEvents);

    const recurringEvents: RecurringEvents[] = await this.recurringEventRepository.find({})
    await async.each(recurringEvents , async recurringEvent => {
        const resultAcurring= await this.buildRecurringEventArray(recurringEvent,startDate,endDate);
        allEvents=allEvents.concat(resultAcurring);
    });

    return allEvents;
  }
}
