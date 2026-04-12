import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../users/entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import { TenantMember, TenantRole } from './entities/tenant-member.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantMember)
    private readonly tenantMemberRepository: Repository<TenantMember>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      email: dto.email,
      password_hash: passwordHash,
      full_name: dto.fullName,
    });

    const tenantName = dto.tenantName || `${dto.fullName}'s Workspace`;
    const slug = this.generateSlug(tenantName);

    const tenant = this.tenantRepository.create({
      name: tenantName,
      slug,
      owner_id: user.id,
      is_active: true,
    });
    await this.tenantRepository.save(tenant);

    const membership = this.tenantMemberRepository.create({
      tenant_id: tenant.id,
      user_id: user.id,
      role: TenantRole.OWNER,
      joined_at: new Date(),
    });
    await this.tenantMemberRepository.save(membership);

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: TenantRole.OWNER,
    };

    const tokens = await this.generateTokens(payload);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const membership = await this.tenantMemberRepository.findOne({
      where: { user_id: user.id },
      order: { created_at: 'ASC' },
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      tenantId: membership?.tenant_id || '',
      role: membership?.role || 'member',
    };

    const tokens = await this.generateTokens(payload);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    await this.usersService.update(user.id, { last_login_at: new Date() });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
      tokens,
    };
  }

  async refresh(refreshTokenValue: string) {
    if (!refreshTokenValue) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const tokenHash = await this.hashToken(refreshTokenValue);

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token_hash: tokenHash, is_revoked: false },
    });

    if (!storedToken || storedToken.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Verify the JWT itself
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshTokenValue, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    storedToken.is_revoked = true;
    await this.refreshTokenRepository.save(storedToken);

    // Generate new pair
    const newPayload: JwtPayload = {
      userId: payload.userId,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };

    const tokens = await this.generateTokens(newPayload);
    await this.saveRefreshToken(payload.userId, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.refreshTokenRepository.update(
      { user_id: userId, is_revoked: false },
      { is_revoked: true },
    );
    this.logger.log(`User logged out: ${userId}`);
  }

  async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiresIn', '15m') as any,
      }),
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn', '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.is_active) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private async saveRefreshToken(userId: string, token: string) {
    const tokenHash = await this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = this.refreshTokenRepository.create({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  private async hashToken(token: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${base}-${uuidv4().substring(0, 8)}`;
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const membership = await this.tenantMemberRepository.findOne({
      where: { user_id: userId },
      relations: ['tenant'],
      order: { created_at: 'ASC' },
    });

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      tenant: membership
        ? {
            id: membership.tenant.id,
            name: membership.tenant.name,
            slug: membership.tenant.slug,
            role: membership.role,
          }
        : null,
    };
  }
}
