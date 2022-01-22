import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserEntity } from '../../user/user';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!this.matchRoles(user, roles)) {
      throw new ForbiddenException('Forbidden');
    }
    return true;
  }

  matchRoles(
    user: UserEntity,
    roles: string[],
  ): boolean | Promise<boolean> | Observable<boolean> {
    return roles.includes(user.roles);
  }
}
