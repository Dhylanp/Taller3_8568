import { Body, ConflictException, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators';

export class EdificioDto {
  @ApiProperty({ example: 'Torre D' }) @IsString() @MinLength(2) nombre: string;
}

@Injectable()
export class EdificiosService {
  constructor(private prisma: PrismaService) {}

  listar() { return this.prisma.edificio.findMany({ orderBy: { nombre: 'asc' } }); }

  async obtener(id: number) {
    const e = await this.prisma.edificio.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Edificio no encontrado');
    return e;
  }

  async crear(dto: EdificioDto) {
    if (await this.prisma.edificio.findUnique({ where: { nombre: dto.nombre } }))
      throw new ConflictException('Ya existe un edificio con ese nombre');
    return this.prisma.edificio.create({ data: dto });
  }

  async actualizar(id: number, dto: EdificioDto) {
    await this.obtener(id);
    return this.prisma.edificio.update({ where: { id }, data: dto });
  }

  async eliminar(id: number) {
    await this.obtener(id);
    if (await this.prisma.espacio.count({ where: { edificioId: id } }))
      throw new ConflictException('El edificio tiene espacios asociados');
    return this.prisma.edificio.delete({ where: { id } });
  }
}

@ApiTags('edificios')
@ApiBearerAuth()
@Controller('edificios')
export class EdificiosController {
  constructor(private s: EdificiosService) {}
  @Get() listar() { return this.s.listar(); }
  @Get(':id') obtener(@Param('id', ParseIntPipe) id: number) { return this.s.obtener(id); }
  @Roles('ADMIN') @Post() crear(@Body() dto: EdificioDto) { return this.s.crear(dto); }
  @Roles('ADMIN') @Patch(':id') actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: EdificioDto) { return this.s.actualizar(id, dto); }
  @Roles('ADMIN') @Delete(':id') eliminar(@Param('id', ParseIntPipe) id: number) { return this.s.eliminar(id); }
}

@Module({ providers: [EdificiosService], controllers: [EdificiosController] })
export class EdificiosModule {}
