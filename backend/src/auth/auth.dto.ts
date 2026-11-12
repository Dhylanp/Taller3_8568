import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'dhylan@unab.cl' }) @IsEmail() correo: string;
  @ApiProperty() @IsString() clave: string;
}

export class RegistroDto {
  @ApiProperty() @IsString() @MinLength(2) nombre: string;
  @ApiProperty() @IsEmail() correo: string;
  @ApiProperty({ minLength: 6 }) @IsString() @MinLength(6) clave: string;
}
