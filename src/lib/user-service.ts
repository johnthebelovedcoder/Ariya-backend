import prisma from './prisma';
import { User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CurrencyService } from './currency-service';
import { BaseService } from './base-service';
import { ConfigService } from './config-service';
import { DatabaseRouter } from './database-router';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  profileImage?: string;
  phone?: string;
  country?: string;
  currency?: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  profileImage?: string;
  phone?: string;
}

export class UserService extends BaseService {
  // Get all users (with optional filtering)
  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
    role?: UserRole,
    countryCode: string = 'NG' // Added country code parameter
  ) {
    const skip = (page - 1) * limit;
    
    const whereClause = role ? { role } : {};
    
    // Use database router for read operations
    const router = new DatabaseRouter();
    const db = router.getReadDatabase(countryCode);
    
    const [users, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          phone: true,
          country: true, // Include country for filtering
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where: whereClause })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get user by ID
  static async getUserById(id: string, countryCode: string = 'NG') {
    // Use database router for read operations
    const router = new DatabaseRouter();
    const db = router.getReadDatabase(countryCode);
    
    return await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        phone: true,
        country: true, // Include country
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  // Create a new user
  static async createUser(userData: CreateUserInput) {
    const config = ConfigService.getInstance();
    const regionSettings = config.getRegionalSettings(userData.country || 'NG');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate country if provided
    if (userData.country && !CurrencyService.isCountrySupported(userData.country)) {
      throw new Error('Country not supported');
    }

    // Validate currency if provided
    if (userData.currency && !CurrencyService.isCurrencySupported(userData.currency)) {
      throw new Error('Currency not supported');
    }

    // Use regional settings as defaults
    let currency = userData.currency || regionSettings.currency;
    let timezone = userData.timezone || regionSettings.timezone;
    let preferredLocale = userData.preferredLocale || regionSettings.locale;

    // Hash password if provided
    let hashedPassword = userData.password;
    if (userData.password) {
      hashedPassword = await bcrypt.hash(userData.password, 12);
    }

    return await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'PLANNER',
        profileImage: userData.profileImage,
        phone: userData.phone,
        country: userData.country || 'NG', // Default to Nigeria
        currency: currency,
        timezone: timezone,
        preferredLocale: preferredLocale
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        phone: true,
        country: true,
        currency: true,
        timezone: true,
        preferredLocale: true,
        createdAt: true,
      }
    });
  }

  // Update user
  static async updateUser(id: string, updateData: UpdateUserInput) {
    // Handle password update separately if needed
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        phone: true,
        updatedAt: true,
      }
    });
  }

  // Delete user
  static async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id }
    });
  }

  // Update user role (admin only)
  static async updateUserRole(id: string, role: UserRole) {
    return await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });
  }
}