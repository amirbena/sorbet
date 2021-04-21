import { Company } from 'src/entites/company.entity'
import { IEventTime } from 'src/entites/simpleEvents.entity'
import { User } from 'src/entites/user.entity'
import { Ranges } from '../entites/recurringEvents.entity'

export interface RecurringEventDetails {
  title: string
  description: string
  date: Date
  company?: Company
  user?: User
  startHour: string
  eventTime: IEventTime
}
