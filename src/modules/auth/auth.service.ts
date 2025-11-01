import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import { UserService } from '../users/user.service';
import { ConfigService } from '@nestjs/config';

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  user: any; // Replace with actual user type
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logger: LoggerService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      this.logger.warn('Login failed - user not found', { email: input.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is suspended
    if (user.isSuspended) {
      this.logger.security('Login attempt on suspended account', { userId: user.id, email: input.email });
      throw new ForbiddenException('Account suspended');
    }

    // Check if account is verified
    if (!user.isVerified) {
      throw new ForbiddenException('Account not verified');
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new ForbiddenException('Account temporarily locked due to multiple failed login attempts');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn('Login failed - invalid password', { userId: user.id, email: input.email });
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset login attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });

    // Generate tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: input.rememberMe 
        ? this.configService.get('app.jwt.rememberMeExpiresIn', '30d') 
        : this.configService.get('app.jwt.expiresIn', '15m'),
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: this.configService.get('app.jwt.refreshExpiresIn', '7d') },
    );

    this.logger.auth('Login successful', user.id, { email: input.email, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(userData: any) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ForbiddenException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: 'PLANNER', // Default role based on schema
        isVerified: false, // New users need to verify email
      },
    });

    this.logger.info('New user registered', { userId: user.id, email: user.email });

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private async handleFailedLogin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const newFailedLoginAttempts = user.failedLoginAttempts + 1;

    // Check if account should be locked
    if (newFailedLoginAttempts >= 5) { // Lock after 5 failed attempts
      const lockoutUntil = new Date();
      lockoutUntil.setHours(lockoutUntil.getHours() + 1); // Lock for 1 hour

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newFailedLoginAttempts,
          lockoutUntil,
        },
      });

      throw new ForbiddenException('Account temporarily locked due to multiple failed login attempts');
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newFailedLoginAttempts,
        },
      });
    }
  }
}