import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators';

class EquipoItem {
  @ApiProperty() @IsInt() equipamientoId: number;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) cantidad?: number;
}

export class EspacioDto {
  @ApiProperty() @IsString() nombre: string;
  @ApiProperty({ example: 'Laboratorio' }) @IsString() tipo: string;
  @ApiProperty() @IsInt() piso: number;
  @ApiProperty() @IsInt() @Min(1) capacidad: number;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() disponible?: boolean;
  @ApiProperty() @IsInt() edificioId: number;
  @ApiPropertyOptional({ type: [EquipoItem] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => EquipoItem) equipamiento?: EquipoItem[];
}
export class EspacioUpdateDto extends PartialType(EspacioDto) {}

export class FiltroEspacios {
  @ApiPropertyOptional() @IsOptional() @IsString() tipo?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() edificioId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
}

class FechaQuery {
  @ApiProperty({ example: '2026-11-20' }) @IsDateString() fecha: string;
}

const incluir = { edificio: true, equipamiento: { include: { equipamiento: true } } };

@Injectable()
export class EspaciosService {
  constructor(private prisma: PrismaService) {}

  listar(f: FiltroEspacios) {
    return this.prisma.espacio.findMany({
      where: {
        tipo: f.tipo,
        edificioId: f.edificioId,
        nombre: f.q ? { contains: f.q, mode: 'insensitive' } : undefined,
      },
      include: incluir,
      orderBy: { id: 'asc' },
    });
  }

  async obtener(id: number) {
    const e = await this.prisma.espacio.findUnique({ where: { id }, include: incluir });
    if (!e) throw new NotFoundException('Espacio no encontrado');
    return e;
  }

  private async validarEdificio(id?: number) {
    if (id !== undefined && !(await this.prisma.edificio.findUnique({ where: { id } })))
      throw new BadRequestException('El edificio no existe');
  }

  async crear(dto: EspacioDto) {
    await this.validarEdificio(dto.edificioId);
    const { equipamiento, ...datos } = dto;
    try {
      return await this.prisma.espacio.create({
        data: {
          ...datos,
          equipamiento: { create: equipamiento?.map(e => ({ equipamientoId: e.equipamientoId, cantidad: e.cantidad ?? 1 })) },
        },
        include: incluir,
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe un espacio con ese nombre en el edificio');
      if (e.code === 'P2003') throw new BadRequestException('Equipamiento inexistente');
      throw e;
    }
  }

  async actualizar(id: number, dto: EspacioUpdateDto) {
    await this.obtener(id);
    await this.validarEdificio(dto.edificioId);
    const { equipamiento, ...datos } = dto;
    try {
      return await this.prisma.$transaction(async tx => {
        if (equipamiento) {
          await tx.espacioEquipamiento.deleteMany({ where: { espacioId: id } });
          await tx.espacioEquipamiento.createMany({
            data: equipamiento.map(e => ({ espacioId: id, equipamientoId: e.equipamientoId, cantidad: e.cantidad ?? 1 })),
          });
        }
        return tx.espacio.update({ where: { id }, data: datos, include: incluir });
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe un espacio con ese nombre en el edificio');
      if (e.code === 'P2003') throw new BadRequestException('Equipamiento inexistente');
      throw e;
    }
  }

  async eliminar(id: number) {
    await this.obtener(id);
    if (await this.prisma.reserva.count({ where: { espacioId: id } }))
      throw new ConflictException('El espacio tiene reservas; márcalo como no disponible en vez de eliminarlo');
    return this.prisma.espacio.delete({ where: { id } });
  }

  async disponibilidad(id: number, fecha: string) {
    await this.obtener(id);
    const ini = new Date(`${fecha}T00:00:00`);
    const fin = new Date(ini.getTime() + 86400000);
    const ocupado = await this.prisma.reserva.findMany({
      where: { espacioId: id, estado: { in: ['PENDIENTE', 'APROBADA'] }, inicio: { lt: fin }, fin: { gt: ini } },
      select: { id: true, inicio: true, fin: true, estado: true },
      orderBy: { inicio: 'asc' },
    });
    return { espacioId: id, fecha, ocupado };
  }

  equipamientos() { return this.prisma.equipamiento.findMany({ orderBy: { nombre: 'asc' } }); }
}

@ApiTags('espacios')
@ApiBearerAuth()
@Controller()
export class EspaciosController {
  constructor(private s: EspaciosService) {}
  @Get('espacios') listar(@Query() f: FiltroEspacios) { return this.s.listar(f); }
  @Get('equipamiento') equipamiento() { return this.s.equipamientos(); }
  @Get('espacios/:id') obtener(@Param('id', ParseIntPipe) id: number) { return this.s.obtener(id); }
  @Get('espacios/:id/disponibilidad') disp(@Param('id', ParseIntPipe) id: number, @Query() q: FechaQuery) { return this.s.disponibilidad(id, q.fecha); }
  @Roles('ADMIN') @Post('espacios') crear(@Body() dto: EspacioDto) { return this.s.crear(dto); }
  @Roles('ADMIN') @Patch('espacios/:id') actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: EspacioUpdateDto) { return this.s.actualizar(id, dto); }
  @Roles('ADMIN') @Delete('espacios/:id') eliminar(@Param('id', ParseIntPipe) id: number) { return this.s.eliminar(id); }
}

@Module({ providers: [EspaciosService], controllers: [EspaciosController] })
export class EspaciosModule {}
