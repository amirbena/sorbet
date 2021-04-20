import {IsNotEmpty, MinLength,IsEmail ,MaxLength} from "class-validator";

export class UserInsertDto {
    @IsNotEmpty()
    @MinLength(4)
    @MaxLength(100)
    name: string;
    @IsNotEmpty()
    @IsEmail()
    email: string;
}