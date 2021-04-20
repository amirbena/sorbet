import { Column, Entity, PrimaryColumn } from "typeorm";


@Entity("users")
export class User {
    @PrimaryColumn({ type: "int", name: "id" })
    id: number;

    @Column("varchar", { name: "name", length: 255 })
    name: string;

    @Column("text")
    email: string;
}
