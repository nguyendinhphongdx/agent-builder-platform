import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password_hash!: string;

  @IsString()
  @MinLength(1)
  full_name!: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
