import { IEventTime } from "./../../entites/simpleEvents.entity";
import { IsDate, IsString, IsNumber, IsOptional ,IsNotEmpty, IsObject} from "class-validator";
import { Ranges } from "src/entites/recurringEvents.entity";


export class RecurringEventInsertDto {
    @IsOptional()
    @IsNumber()
    companyId?: number;

    @IsOptional()
    @IsNumber()
    userId?: number;

    @IsNotEmpty()
    @IsDate()
    firstDate: Date;

    @IsNotEmpty()
    ranges: Ranges;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    startHour: string;

    @IsNotEmpty()
    @IsObject()
    eventTime: IEventTime;
}