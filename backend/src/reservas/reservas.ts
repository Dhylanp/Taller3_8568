import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { EstadoReserva, Prisma } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Roles, UsuarioActual } from '../auth/decorators';
import { Accion, AuditoriaModule, AuditoriaService } from '../auditoria/auditoria';

export class ReservaDto {
  @ApiProperty() @IsInt() espacioId: number;
  @ApiProperty({ example: '2026-11-20T10:00:00' }) @IsDateString() inicio: string;
  @ApiProperty({ example: '2026-11-20T11:00:00' }) @IsDateString() fin: string;
  @ApiPropertyOptional() @IsOptional() @IsString() motivo?: string;
}

class FiltroReservas {
  @ApiPropertyOptional({ enum: EstadoReserva }) @IsOptional() @IsEnum(EstadoReserva) estado?: EstadoReserva;
}

type Actual = { id: number; rol: string };
const incluir = {
  espacio: { include: { edificio: true } },
  usuario: { select: { id: true, nombre: true, correo: true } },
};
const ACTIVAS: EstadoReserva[] = ['PENDIENTE', 'APROBADA'];

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService, private auditoria: AuditoriaService) {}

  async crear(u: Actual, dto: ReservaDto) {
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);
    if (fin <= inicio) throw new BadRequestException('La hora de término debe ser posterior al inicio');
    if (inicio < new Date()) throw new BadRequestException('No se puede reservar en el pasado');
    const espacio = await this.prisma.espacio.findUnique({ where: { id: dto.espacioId } });
    if (!espacio) throw new NotFoundException('Espacio no encontrado');
    if (!espacio.disponible) throw new ConflictException('El espacio no está disponible para reservas');

    try {
      // Serializable: dos solicitudes simultáneas al mismo tramo no pueden pasar ambas
      const creada = await this.prisma.$transaction(async tx => {
        const choque = await tx.reserva.findFirst({
          where: { espacioId: dto.espacioId, estado: { in: ACTIVAS }, inicio: { lt: fin }, fin: { gt: inicio } },
        });
        if (choque) throw new ConflictException('Conflicto de horario: el espacio ya está reservado en ese tramo');
        return tx.reserva.create({
          data: { usuarioId: u.id, espacioId: dto.espacioId, inicio, fin, motivo: dto.motivo },
          include: incluir,
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      await this.auditoria.registrar('CREADA', u, creada);
      return creada;
    } catch (e: any) {
      if (e.code === 'P2034') throw new ConflictException('Conflicto de horario: intenta nuevamente');
      throw e;
    }
  }

  mias(u: Actual) {
    return this.prisma.reserva.findMany({ where: { usuarioId: u.id }, include: incluir, orderBy: { inicio: 'desc' } });
  }

  todas(f: FiltroReservas) {
    return this.prisma.reserva.findMany({ where: { estado: f.estado }, include: incluir, orderBy: { inicio: 'desc' } });
  }

  private async cargar(id: number) {
    const r = await this.prisma.reserva.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Reserva no encontrada');
    return r;
  }

  private async cambiar(id: number, desde: EstadoReserva[], hacia: EstadoReserva, accion: Accion, actor: Actual) {
    const r = await this.cargar(id);
    if (!desde.includes(r.estado)) throw new ConflictException(`No se puede pasar de ${r.estado} a ${hacia}`);
    const nueva = await this.prisma.reserva.update({ where: { id }, data: { estado: hacia }, include: incluir });
    await this.auditoria.registrar(accion, actor, nueva);
    return nueva;
  }

  aprobar(id: number, a: Actual) { return this.cambiar(id, ['PENDIENTE'], 'APROBADA', 'APROBADA', a); }
  rechazar(id: number, a: Actual) { return this.cambiar(id, ['PENDIENTE'], 'RECHAZADA', 'RECHAZADA', a); }

  async cancelar(id: number, u: Actual) {
    const r = await this.cargar(id);
    if (r.usuarioId !== u.id && u.rol !== 'ADMIN') throw new ForbiddenException('Solo puedes cancelar tus propias reservas');
    return this.cambiar(id, ACTIVAS, 'CANCELADA', 'CANCELADA', u);
  }
}

@ApiTags('reservas')
@ApiBearerAuth()
@Controller('reservas')
export class ReservasController {
  constructor(private s: ReservasService) {}
  @Post() crear(@UsuarioActual() u: Actual, @Body() dto: ReservaDto) { return this.s.crear(u, dto); }
  @Get('mias') mias(@UsuarioActual() u: Actual) { return this.s.mias(u); }
  @Roles('ADMIN') @Get() todas(@Query() f: FiltroReservas) { return this.s.todas(f); }
  @Roles('ADMIN') @Patch(':id/aprobar') aprobar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: Actual) { return this.s.aprobar(id, u); }
  @Roles('ADMIN') @Patch(':id/rechazar') rechazar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: Actual) { return this.s.rechazar(id, u); }
  @Patch(':id/cancelar') cancelar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: Actual) { return this.s.cancelar(id, u); }
}

@Module({ imports: [AuditoriaModule], providers: [ReservasService], controllers: [ReservasController] })
export class ReservasModule {}
