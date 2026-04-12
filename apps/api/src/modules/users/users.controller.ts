import { Controller, Get, Put, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile() {
    const result = await this.usersService.getProfile();
    if (!result) {
      throw new ForbiddenException('User not found');
    }
    return result;
  }

  @Put('me')
  async updateProfile(@Body() dto: UpdateUserDto) {
    const result = await this.usersService.updateProfile(dto);
    if (!result) {
      throw new ForbiddenException('User not found');
    }
    return result;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  async listTenantMembers() {
    return this.usersService.findTenantMembers();
  }
}
