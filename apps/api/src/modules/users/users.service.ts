import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestContextService } from '../../common/context';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly ctx: RequestContextService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      email: dto.email,
      password_hash: dto.password_hash,
      full_name: dto.full_name,
      avatar_url: dto.avatar_url,
    });
    return this.userRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User | null> {
    await this.userRepository.update(id, dto);
    return this.findById(id);
  }

  async getProfile(): Promise<User | null> {
    return this.findById(this.ctx.userId);
  }

  async updateProfile(dto: UpdateUserDto): Promise<User | null> {
    return this.update(this.ctx.userId, dto);
  }

  async findTenantMembers(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('tenant_members', 'tm', 'tm.user_id = user.id')
      .where('tm.tenant_id = :tenantId', { tenantId: this.ctx.tenantId })
      .andWhere('tm.deleted_at IS NULL')
      .andWhere('user.deleted_at IS NULL')
      .select(['user.id', 'user.email', 'user.full_name', 'user.avatar_url', 'user.is_active', 'user.created_at'])
      .getMany();
  }
}
