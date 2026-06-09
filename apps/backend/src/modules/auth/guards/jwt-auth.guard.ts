import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { OPTIONAL_AUTH_KEY } from '../../../common/decorators/optional-auth.decorator';

/** Global auth guard — validates the access JWT unless @Public(); @OptionalAuth() lets guests through. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  private isOptional(context: ExecutionContext): boolean {
    return !!this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  // Don't throw for optional-auth routes when no/invalid token; just leave user undefined.
  handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown, context: ExecutionContext): TUser {
    if (this.isOptional(context)) {
      return (user ?? undefined) as TUser;
    }
    return super.handleRequest(err, user, info, context) as TUser;
  }
}
