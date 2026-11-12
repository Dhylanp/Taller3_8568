import { Controller, ForbiddenException, Get, Injectable, Logger, Module, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectModel, MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Model } from 'mongoose';
import { PrismaService } from '../prisma/prisma.service';
import { Roles, UsuarioActual } from '../auth/decorators';

export const ACCIONES = ['CREADA', 'APROBADA', 'RECHAZADA', 'CANCELADA'] as const;
export type Accion = (typeof ACCIONES)[number];

// Un documento por evento: no tiene relaciones ni estructura fija en `detalle`,
// y crece sin parar, por eso va en Mongo y no en una tabla de Postgres.
@Schema({ collection: 'auditoria_reservas', timestamps: { createdAt: 'fecha', updatedAt: false } })
export class AuditoriaEvento {
  @Prop({ required: true, enum: ACCIONES }) accion: Accion;
  @Prop({ required: true, index: true }) reservaId: number;
  @Prop({ required: true, index: true }) usuarioId: number;   // quién ejecutó la acción
  @Prop({ required: true }) rolUsuario: string;
  @Prop({ required: true }) espacioId: number;
  @Prop({ type: Object }) detalle?: Record<string, unknown>;  // foto de la reserva en ese momento
  fecha: Date;
}
export const AuditoriaSchema = SchemaFactory.createForClass(AuditoriaEvento);

class FiltroAuditoria {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() reservaId?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() usuarioId?: number;
  @ApiPropertyOptional({ enum: ACCIONES }) @IsOptional() @IsIn(ACCIONES as unknown as string[]) accion?: Accion;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limite?: number;
}

@Injectable()
export class AuditoriaService {
  private log = new Logger('Auditoria');
  constructor(@InjectModel(AuditoriaEvento.name) private model: Model<AuditoriaEvento>, private prisma: PrismaService) {}

  // La auditoría no debe tumbar la reserva: si Mongo falla, se registra el error y se sigue.
  async registrar(accion: Accion, actor: { id: number; rol: string }, reserva: { id: number; espacioId: number; [k: string]: unknown }) {
    try {
      await this.model.create({
        accion, reservaId: reserva.id, usuarioId: actor.id, rolUsuario: actor.rol, espacioId: reserva.espacioId,
        detalle: { estado: reserva.estado, inicio: reserva.inicio, fin: reserva.fin, motivo: reserva.motivo, duenoId: reserva.usuarioId },
      });
    } catch (e) {
      this.log.error(`No se pudo registrar ${accion} de la reserva ${reserva.id}: ${(e as Error).message}`);
    }
  }

  buscar(f: FiltroAuditoria) {
    const filtro: Record<string, unknown> = {};
    if (f.reservaId !== undefined) filtro.reservaId = f.reservaId;
    if (f.usuarioId !== undefined) filtro.usuarioId = f.usuarioId;
    if (f.accion) filtro.accion = f.accion;
    return this.model.find(filtro)
      .sort({ fecha: -1 }).limit(f.limite ?? 50).lean();
  }

  async historialDeReserva(id: number, actor: { id: number; rol: string }) {
    const r = await this.prisma.reserva.findUnique({ where: { id }, select: { usuarioId: true } });
    if (r && r.usuarioId !== actor.id && actor.rol !== 'ADMIN') throw new ForbiddenException('No puedes ver el historial de otra persona');
    return this.model.find({ reservaId: id }).sort({ fecha: 1 }).lean();
  }
}

@ApiTags('auditoria')
@ApiBearerAuth()
@Controller()
export class AuditoriaController {
  constructor(private s: AuditoriaService) {}
  @Roles('ADMIN') @Get('auditoria') buscar(@Query() f: FiltroAuditoria) { return this.s.buscar(f); }
  @Get('reservas/:id/historial') historial(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: { id: number; rol: string }) {
    return this.s.historialDeReserva(id, u);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: AuditoriaEvento.name, schema: AuditoriaSchema }])],
  providers: [AuditoriaService],
  controllers: [AuditoriaController],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
