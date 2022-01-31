import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Like, Raw, Repository } from 'typeorm';
import { UserEntity } from '../user/user';

@Injectable()
export class SearchService {
  constructor(@InjectRepository(UserEntity) private userRepo: Repository<UserEntity>) {}
  // search user
  searchUser(q: string) {
    return this.userRepo.find({
      where: { username: ILike(`%${q}%`) },
      take: 7,
      //   username: Raw((alias) => `alias.toLowerCase() like '%${q.toLowerCase()}%'`),
    });
  }
}
