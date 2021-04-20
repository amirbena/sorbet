import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { User } from 'src/entites/user.entity';
import { UserInsertDto } from '../dto/user-insert.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) { }

    public async insertNewUser(userDto: UserInsertDto): Promise<User> {
        return await this.userRepository.create(userDto);
    }

    public async getAllUsers(): Promise<User[]> {
        return await this.userRepository.find();
    }

    public async changeUserEmail(user_id: number, email: string):Promise<void> {
        const user:User = await this.userRepository.findOne({ id: user_id });
        await this.userRepository.update({ email }, user);
    }
}
