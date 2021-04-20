import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import entities from './entites';
const typeOrmModuleConfig: TypeOrmModuleOptions = {
    type: "postgres",
    host: "localhost",
    port: 5433,
    username: "postgres",
    password: "root",
    database: "calender",
    entities,
    synchronize: false
}

export default typeOrmModuleConfig;