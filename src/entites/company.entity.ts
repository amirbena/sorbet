import { Column, Entity, PrimaryColumn } from "typeorm";


@Entity("companies")
export class Company {
  @PrimaryColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255,nullable: false })
  name: string;

}
