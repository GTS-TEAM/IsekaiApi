import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberNotFoundException } from 'src/error/error.dto';
import { UserEntity } from 'src/user/user';
import { DeepPartial, Repository } from 'typeorm';
import { MemberEntity } from '../entities/member';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
  ) {}

  async save(member: MemberEntity): Promise<MemberEntity> {
    return await this.memberRepo.save(member);
  }

  async createMember(user: UserEntity): Promise<MemberEntity> {
    const member = this.memberRepo.create({ user });
    return await this.memberRepo.save(member);
  }

  async createMembers(users: UserEntity[]): Promise<MemberEntity[]> {
    const members = users.map((user) => this.memberRepo.create({ user }));
    return await this.memberRepo.save(members);
  }
  //   async create(entityLikeArray: DeepPartial<MemberEntity>[]): Promise<MemberEntity[]> {
  //     this.memberRepo.create(entityLike);
  //     return await this.memberRepo.save(entityLike);
  //   }

  async findMember(userId: string, conversationId: string): Promise<MemberEntity> {
    const member = await this.memberRepo
      .createQueryBuilder('members')
      .where('members.user_id = :userId', { userId })
      .andWhere('members.conversation_id = :conversationId', { conversationId })
      .leftJoinAndSelect('members.user', 'user')
      .getOne();
    if (!member) {
      throw new MemberNotFoundException();
    }
    return member;
  }
}
