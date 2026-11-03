import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export const OptionalAuth_KEY = 'delta:optional-auth';
export const OptionalAuth = () => SetMetadata(OptionalAuth_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req: Request = ctx.switchToHttp().getRequest();
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      if ((ctx.getHandler() as any)?.[OptionalAuth_KEY]) return true;
      throw new UnauthorizedException('Требуется авторизация');
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; username: string }>(auth.slice(7));
      (req as any).user = { userId: payload.sub, username: payload.username };
      return true;
    } catch {
      throw new UnauthorizedException('Сессия истекла, войдите заново');
    }
  }
}
