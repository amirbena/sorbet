import { Column, ManyToMany, Entity, PrimaryColumn } from "typeorm";
import { Company } from "./company.entity";
import { User } from "./user.entity";
import { IEventTime } from "./simpleEvents.entity";



export enum Ranges {
    Daily = 1,
    Weekly = 7,
    Monthly = 30,
    BI_Weekly = 3
}
@Entity("recurringEvents")
export class RecurringEvents {
    @PrimaryColumn({ type: "int", name: "id" })
    id: number;

    @ManyToMany(type => Company, { nullable: true, onDelete: "SET NULL" })
    company?: Company;

    @ManyToMany(type => User, { nullable: true, onDelete: "SET NULL" })

    user?: User;

    @Column("date")
    firstDate: Date;

    @Column("int")
    range: Ranges;


    @Column("text")
    title: string;

    @Column("text")
    description: string;

    @Column("text")
    startHour: string;

    @Column("json")
    eventTime: IEventTime;

}