import { RecurringEventInsertDto } from './../dto/recurring-event-insert-dto';
import { SimpleEventInsertDto } from './../dto/simple-event-insert.dto';
import { UserService} from "../services/user.service";
import { CalenderService} from "../services/calender.service";
import { Controller, Post, Body, UsePipes, ValidationPipe, Put, Param, Get } from "@nestjs/common";
import { UserInsertDto } from "../dto/user-insert.dto";

@Controller("calender")
export class CalenderController {
    constructor(private calenderService: CalenderService, private userService: UserService) { }

    @Post("userSignup")
    @UsePipes(ValidationPipe)
    async userSignUp(@Body() userDto: UserInsertDto) {
        return this.userService.insertNewUser(userDto);
    }

    @Post("simple")
    @UsePipes(ValidationPipe)
    async addSimpleEvent(@Body() simpleEventDto: SimpleEventInsertDto) {
        return this.calenderService.addSimpleEvent(simpleEventDto);
    }

    @Put(":id/changeSimpleDate")
    async changeSimpleEventDate(@Param("id") id: number, @Body("date") newDate: Date) {
        return this.calenderService.changeSimpleEventDate(id, newDate);
    }

    @Post("addRecurringEvent")
    @UsePipes(ValidationPipe)
    async addRecurringEvent(@Body() reccurringDto: RecurringEventInsertDto) {
        return this.calenderService.addRecurringEvent(reccurringDto);
    }

    @Put(":id/dateInstanceRecurringEvent")
    async changeDateOfRecurringInstance(@Param("id") recurringId: number, @Body("dateToChange") date:Date, @Body("newDate") newDate:Date) {
        return this.calenderService.changeDateOfRecurringInstance(recurringId,date,newDate);
    }

    @Put(":id/cancelRecurringInstance")
    async cancelRecurringEventInstance(@Param("id") recurringId: number, @Body("date") date:Date){
        return this.calenderService.cancelRecurringEventInstance(recurringId,date);
    }


    @Get("instancesBetweenDays")
    async getAllEventsInEachTime(@Body("startDate") startDate:Date, @Body("endDate") endDate: Date){
        return this.calenderService.getAllEventsInEachTime(startDate,endDate);
    }
}
