import { IntersectionType } from '@nestjs/swagger';
import { AbstractDto } from '../../common/abstract.dto';
import { UserInfo } from './user-info';

export class UserDto extends IntersectionType(AbstractDto, UserInfo) {}
