import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthOptionalGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false,
    _info: unknown,
  ): TUser | null {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
