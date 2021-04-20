import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CalenderModule } from "./calender/calender.module";
import ormConfig from "./ormconfig";
@Module({
  imports: [
    TypeOrmModule.forRoot(ormConfig),
    CalenderModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
