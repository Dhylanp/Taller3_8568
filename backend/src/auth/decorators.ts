import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Public = () => SetMetadata('public', true);
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
export const UsuarioActual = createParamDecorator((_: unknown, ctx: ExecutionContext) =>
  ctx.switchToHttp().getRequest().usuario as { id: number; rol: string });
