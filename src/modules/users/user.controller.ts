import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Return paginated users' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // Ensure limits are within acceptable range
    limit = Math.min(limit, 100); // Max 100 items per page
    
    return await this.userService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Return user information' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      success: true,
      data: user,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    return await this.userService.delete(id);
  }
}