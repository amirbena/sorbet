import { RecurringEvents } from "./recurringEvents.entity";
import { Column, ManyToMany, Entity, PrimaryColumn } from "typeorm";


@Entity("eventDateChanges")
export class EventDateChanges {
    @PrimaryColumn({ type: "int", name: "id" })
    id: number;

    @ManyToMany(type => RecurringEvents, { onDelete: "CASCADE" })
    recurringEvent: RecurringEvents;

    @Column("date")
    originalDate: Date;

    @Column("date",{ nullable: true })
    replacedDate?: Date;

    @Column("boolean", { nullable: true })
    isCanceled?: boolean;



}