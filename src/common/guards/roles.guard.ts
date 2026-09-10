import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthenticatedRequest {
  user?: {
    role?: Role;
  };
}

/**
 * Integration note: req.user.role is not propagated by Auth yet.
 * Later, update src/auth/strategies/jwt.strategy.ts:21-22 in validate()
 * and src/auth/auth.service.ts:79 in the signed JWT payload.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRole = request.user?.role;

    return userRole !== undefined && requiredRoles.includes(userRole);
  }
}
