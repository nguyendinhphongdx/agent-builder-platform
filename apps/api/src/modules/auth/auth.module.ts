import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { TenantLlmKeysController } from './tenant-llm-keys.controller';
import { AuthService } from './auth.service';
import { TenantLlmKeysService } from './tenant-llm-keys.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

import { Tenant } from './entities/tenant.entity';
import { TenantMember } from './entities/tenant-member.entity';
import { TenantLlmKey } from './entities/tenant-llm-key.entity';
import { ApiKey } from './entities/api-key.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      TenantMember,
      TenantLlmKey,
      ApiKey,
      RefreshToken,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController, TenantLlmKeysController],
  providers: [AuthService, TenantLlmKeysService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, TenantLlmKeysService],
})
export class AuthModule {}
