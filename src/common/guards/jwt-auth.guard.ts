import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { IS_PUBLIC_ROUTE } from '../decorators/public.decorator';
import { IS_OPTIONAL_AUTH_ROUTE } from '../decorators/optional-auth.decorator';
import type { JwtUserPayload } from '../../modules/user/user.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublicRoute) {
      return true;
    }

    const isOptionalAuthRoute = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUserPayload }>();
    const token = this.extractBearerToken(request);

    if (!token) {
      if (isOptionalAuthRoute) {
        return true;
      }

      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtUserPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired bearer token');
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
