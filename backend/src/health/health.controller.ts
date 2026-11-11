import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators';

@Public()
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService, @InjectConnection() private mongo: Connection) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', postgres: 'ok', mongo: this.mongo.readyState === 1 ? 'ok' : 'down' };
  }
}
