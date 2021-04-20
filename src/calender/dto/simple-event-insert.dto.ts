import { IEventTime } from "./../../entites/simpleEvents.entity";
import { IsDate, IsString, IsNumber, IsOptional ,IsNotEmpty, IsObject} from "class-validator";


export class SimpleEventInsertDto {
    @IsOptional()
    @IsNumber()
    companyId?: number;

    @IsOptional()
    @IsNumber()
    userId?: number;

    @IsNotEmpty()
    @IsDate()
    originalDate: Date;



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