import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegistroDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private async emitir(u: { id: number; nombre: string; correo: string; rol: string }) {
    const token = await this.jwt.signAsync({ sub: u.id, rol: u.rol });
    return { token, usuario: { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol } };
  }

  async login(dto: LoginDto) {
    const u = await this.prisma.usuario.findUnique({ where: { correo: dto.correo } });
    if (!u || !(await bcrypt.compare(dto.clave, u.claveHash)))
      throw new UnauthorizedException('Correo o clave incorrectos');
    return this.emitir(u);
  }

  async registro(dto: RegistroDto) {
    if (await this.prisma.usuario.findUnique({ where: { correo: dto.correo } }))
      throw new ConflictException('El correo ya está registrado');
    const u = await this.prisma.usuario.create({
      data: { nombre: dto.nombre, correo: dto.correo, claveHash: await bcrypt.hash(dto.clave, 10) },
    });
    return this.emitir(u);
  }
}
