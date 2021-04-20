import { Column,  ManyToMany, Entity, PrimaryColumn } from "typeorm";
import { Company } from "./company.entity";
import { User } from "./user.entity";


export interface IEventTime {
    minutes: number;
    hours?: number;
}

@Entity("simpleEvents")
export class SimpleEvents {
    @PrimaryColumn({ type: "int", name: "id" })
    id: number;

    @ManyToMany(type => Company, { nullable: true, onDelete: "SET NULL" })
    company?: Company;

    @ManyToMany(type => User, { nullable: true, onDelete: "SET NULL" })

    user?: User;

    @Column("date")
    originalDate: Date;



    @Column("text")
    title: string;

    @Column("text")
    description: string;

    @Column("date")
    startHour: string;

    @Column("json")
    eventTime: IEventTime;

}
