import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async findById(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (user) {
        // Don't return sensitive data like password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }

      return null;
    } catch (error) {
      this.logger.error('Error finding user by ID', { userId: id, error: error.message });
      throw error;
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Don't return sensitive data like password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }

      return null;
    } catch (error) {
      this.logger.error('Error finding user by email', { email, error: error.message });
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const users = await this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Don't return sensitive data like passwords
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      const total = await this.prisma.user.count();
      
      return {
        data: usersWithoutPasswords,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error finding all users', { error: error.message });
      throw error;
    }
  }

  async update(id: string, updateData: UpdateUserDto) {
    try {
      // Map DTO fields to Prisma schema fields
      const prismaUpdateData: any = {};
      
      if (updateData.name) prismaUpdateData.name = updateData.name;
      if (updateData.email) prismaUpdateData.email = updateData.email;
      if (updateData.role) prismaUpdateData.role = updateData.role;
      if (updateData.lastLoginAt) prismaUpdateData.lastLoginAt = updateData.lastLoginAt;
      
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: prismaUpdateData,
      });

      // Don't return sensitive data like password
      const { password, ...userWithoutPassword } = updatedUser;
      
      this.logger.info('User updated successfully', { userId: id });
      
      return userWithoutPassword;
    } catch (error) {
      this.logger.error('Error updating user', { userId: id, error: error.message });
      throw error;
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });

      this.logger.info('User deleted successfully', { userId: id });
      
      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting user', { userId: id, error: error.message });
      throw error;
    }
  }
}