import { BadRequestException, Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators';

// Horario de funcionamiento usado para calcular el % de ocupación (08:00–17:00, como los bloques del Taller 2)
const HORAS_POR_DIA = 9;

class RangoDto {
  @ApiPropertyOptional({ example: '2026-11-01', description: 'Por defecto: primer día del mes actual' })
  @IsOptional() @IsDateString() desde?: string;
  @ApiPropertyOptional({ example: '2026-12-01', description: 'Exclusivo. Por defecto: un mes después de "desde"' })
  @IsOptional() @IsDateString() hasta?: string;
}

type FilaEspacio = { id: number; nombre: string; tipo: string; edificio: string; disponible: boolean; reservas: number; horas: number };

@Injectable()
export class PanelService {
  constructor(private prisma: PrismaService) {}

  private rango(q: RangoDto) {
    const ahora = new Date();
    const desde = q.desde ? new Date(q.desde) : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const hasta = q.hasta ? new Date(q.hasta) : new Date(desde.getFullYear(), desde.getMonth() + 1, desde.getDate());
    if (hasta <= desde) throw new BadRequestException('"hasta" debe ser posterior a "desde"');
    return { desde, hasta, dias: Math.ceil((hasta.getTime() - desde.getTime()) / 86400000) };
  }

  private agrupar(filas: FilaEspacio[], clave: 'edificio' | 'tipo', dias: number) {
    const m = new Map<string, { espacios: number; reservas: number; horas: number }>();
    for (const f of filas) {
      const g = m.get(f[clave]) ?? { espacios: 0, reservas: 0, horas: 0 };
      g.espacios += 1; g.reservas += f.reservas; g.horas += f.horas;
      m.set(f[clave], g);
    }
    return [...m].map(([nombre, g]) => ({
      nombre, espacios: g.espacios, reservas: g.reservas, horas: +g.horas.toFixed(1),
      ocupacionPct: +((g.horas / (g.espacios * dias * HORAS_POR_DIA)) * 100).toFixed(1),
    })).sort((a, b) => b.horas - a.horas);
  }

  async utilizacion(q: RangoDto) {
    const { desde, hasta, dias } = this.rango(q);

    const estados = await this.prisma.$queryRaw<{ estado: string; total: number }[]>(Prisma.sql`
      SELECT estado::text, COUNT(*)::int AS total FROM "Reserva"
      WHERE inicio >= ${desde} AND inicio < ${hasta} GROUP BY estado`);

    // LEFT JOIN: los espacios sin reservas aparecen con 0 (sirve para detectar espacios subutilizados)
    const filas = await this.prisma.$queryRaw<FilaEspacio[]>(Prisma.sql`
      SELECT e.id, e.nombre, e.tipo, ed.nombre AS edificio, e.disponible,
             COUNT(r.id)::int AS reservas,
             COALESCE(SUM(EXTRACT(EPOCH FROM (r.fin - r.inicio)) / 3600), 0)::float AS horas
      FROM "Espacio" e
      JOIN "Edificio" ed ON ed.id = e."edificioId"
      LEFT JOIN "Reserva" r ON r."espacioId" = e.id AND r.estado = 'APROBADA'
                           AND r.inicio >= ${desde} AND r.inicio < ${hasta}
      GROUP BY e.id, ed.nombre ORDER BY horas DESC, e.nombre`);

    const porHora = await this.prisma.$queryRaw<{ hora: number; reservas: number }[]>(Prisma.sql`
      SELECT EXTRACT(HOUR FROM inicio)::int AS hora, COUNT(*)::int AS reservas FROM "Reserva"
      WHERE estado = 'APROBADA' AND inicio >= ${desde} AND inicio < ${hasta}
      GROUP BY hora ORDER BY hora`);

    const cuenta = (e: string) => estados.find(x => x.estado === e)?.total ?? 0;
    const resueltas = cuenta('APROBADA') + cuenta('RECHAZADA');
    const horasTotal = filas.reduce((s, f) => s + f.horas, 0);
    const espaciosActivos = filas.filter(f => f.disponible).length;

    return {
      rango: { desde, hasta, dias, horasPorDia: HORAS_POR_DIA },
      resumen: {
        reservas: estados.reduce((s, x) => s + x.total, 0),
        pendientes: cuenta('PENDIENTE'), aprobadas: cuenta('APROBADA'),
        rechazadas: cuenta('RECHAZADA'), canceladas: cuenta('CANCELADA'),
        tasaAprobacionPct: resueltas ? +((cuenta('APROBADA') / resueltas) * 100).toFixed(1) : null,
        horasReservadas: +horasTotal.toFixed(1),
        ocupacionGlobalPct: espaciosActivos ? +((horasTotal / (espaciosActivos * dias * HORAS_POR_DIA)) * 100).toFixed(1) : 0,
      },
      porEdificio: this.agrupar(filas, 'edificio', dias),
      porTipo: this.agrupar(filas, 'tipo', dias),
      masUsados: filas.filter(f => f.reservas > 0).slice(0, 5),
      sinUso: filas.filter(f => f.reservas === 0 && f.disponible).map(f => ({ id: f.id, nombre: f.nombre, edificio: f.edificio })),
      horasPunta: porHora,
    };
  }
}

@ApiTags('panel')
@ApiBearerAuth()
@Controller('panel')
export class PanelController {
  constructor(private s: PanelService) {}
  @Roles('ADMIN') @Get('utilizacion') utilizacion(@Query() q: RangoDto) { return this.s.utilizacion(q); }
}

@Module({ providers: [PanelService], controllers: [PanelController] })
export class PanelModule {}
