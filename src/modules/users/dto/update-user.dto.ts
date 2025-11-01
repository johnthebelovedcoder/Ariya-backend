import { IsEmail, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VENDOR = 'VENDOR',
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsDateString()
  @IsOptional()
  lastLoginAt?: Date;
}