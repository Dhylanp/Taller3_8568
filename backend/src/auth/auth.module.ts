import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtGuard } from './jwt.guard';

@Global()
@Module({
  imports: [JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (c: ConfigService) => ({ secret: c.getOrThrow<string>('JWT_SECRET'), signOptions: { expiresIn: '8h' } }),
  })],
  providers: [AuthService, { provide: APP_GUARD, useClass: JwtGuard }],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
