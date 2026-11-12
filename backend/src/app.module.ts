import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EdificiosModule } from './edificios/edificios';
import { EspaciosModule } from './espacios/espacios';
import { ReservasModule } from './reservas/reservas';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({ uri: c.getOrThrow<string>('MONGO_URL') }),
    }),
    PrismaModule,
    AuthModule,
    EdificiosModule,
    EspaciosModule,
    ReservasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
