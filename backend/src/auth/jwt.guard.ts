import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext) {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>('public', targets)) return true;

    const req = ctx.switchToHttp().getRequest();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException('Falta el token');
    try {
      const p = await this.jwt.verifyAsync(token);
      req.usuario = { id: p.sub, rol: p.rol };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    const roles = this.reflector.getAllAndOverride<string[]>('roles', targets);
    if (roles && !roles.includes(req.usuario.rol)) throw new ForbiddenException('Sin permisos');
    return true;
  }
}
