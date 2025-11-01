import prisma from './prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@prisma/client';
import { isValidEmail, isValidPassword } from './validation';
import { BaseService } from './base-service';

interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class AuthService extends BaseService {
  // Validate password strength
  private static validatePassword(password: string): void {
    if (!isValidPassword(password)) {
      throw new Error('Password does not meet security requirements. Must be at least 8 characters with uppercase, lowercase, number, and special character.');
    }
  }

  static async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = input;
    
    // Validate input
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    if (typeof password !== 'string' || password.length === 0) {
      throw new Error('Password is required');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      // To prevent user enumeration, don't distinguish between "user not found" and "invalid password"
      throw new Error('Invalid credentials');
    }

    // Check if account is verified
    if (!user.isVerified) {
      throw new Error('Account not verified');
    }

    // Check if account is suspended
    if (user.isSuspended) {
      throw new Error('Account suspended');
    }

    // Rate limiting for failed login attempts could go here
    // For now, just check if account is locked after failed attempts
    if (user.failedLoginAttempts >= 5 && user.lockoutUntil && new Date() < user.lockoutUntil) {
      throw new Error('Account temporarily locked due to multiple failed login attempts');
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Update failed login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          failedLoginAttempts: { increment: 1 },
          lockoutUntil: new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes after 5 failed attempts
        }
      });
      
      throw new Error('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          failedLoginAttempts: 0,
          lockoutUntil: null
        }
      });
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        passwordChangedAt: user.passwordChangedAt // Keep existing value
      },
    });

    return {
      user: {
        ...user,
        password: undefined, // Remove password from response
      },
      accessToken,
      refreshToken,
    };
  }

  static async register(input: RegisterInput): Promise<AuthResult> {
    const { email, password, firstName, lastName, role = 'PLANNER' } = input;
    const { TokenService } = await import('./token-service');
    const emailService = (await import('./email-service')).default;
    const { withTransaction } = await import('./transaction');

    // Validate input
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    this.validatePassword(password);

    if (typeof firstName !== 'string' || firstName.trim().length < 2) {
      throw new Error('First name must be at least 2 characters long');
    }
    
    if (typeof lastName !== 'string' || lastName.trim().length < 2) {
      throw new Error('Last name must be at least 2 characters long');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user and send verification email in a transaction
    const user = await withTransaction(async (tx) => {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Combine first and last name
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // Create user
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: fullName,
          role,
          isVerified: false, // New users need to verify their email
          tokenVersion: 0, // For token invalidation
        },
      });

      return newUser;
    });

    // Generate verification token (expires in 24 hours)
    const verificationToken = await TokenService.createToken(user.id, 'EMAIL_VERIFICATION', 1440);

    // Send verification email (don't await to avoid blocking registration)
    emailService.sendVerificationEmail(user.email, user.name, verificationToken).catch(err => {
      console.error('Failed to send verification email:', err);
    });

    // Generate tokens for immediate login
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: {
        ...user,
        password: undefined, // Remove password from response
      },
      accessToken,
      refreshToken,
    };
  }

  static async forgotPassword(email: string): Promise<boolean> {
    const { TokenService } = await import('./token-service');
    const emailService = (await import('./email-service')).default;
    
    // Validate email
    if (!isValidEmail(email)) {
      // Don't reveal if email exists for security
      return true;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists for security
      // Still return true to prevent user enumeration
      return true;
    }

    // Generate password reset token (expires in 60 minutes)
    const token = await TokenService.createToken(user.id, 'PASSWORD_RESET', 60);

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, user.name, token);

    return true;
  }

  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const { TokenService } = await import('./token-service');
    const { withTransaction } = await import('./transaction');
    
    // Validate new password
    this.validatePassword(newPassword);
    
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid reset token');
    }

    // Verify and consume the token
    const userId = await TokenService.verifyAndConsumeToken(token, 'PASSWORD_RESET');
    
    if (!userId) {
      throw new Error('Invalid or expired reset token');
    }

    // Update password and invalidate all sessions in a transaction
    await withTransaction(async (tx) => {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update user password and invalidate tokens
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          tokenVersion: { increment: 1 }, // Invalidate all refresh tokens
        },
      });
    });

    return true;
  }

  static async verifyEmail(token: string): Promise<boolean> {
    const { TokenService } = await import('./token-service');
    const emailService = (await import('./email-service')).default;
    const { withTransaction } = await import('./transaction');
    
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid verification token');
    }

    // Verify and consume the token
    const userId = await TokenService.verifyAndConsumeToken(token, 'EMAIL_VERIFICATION');
    
    if (!userId) {
      throw new Error('Invalid or expired verification token');
    }

    // Update user verification status and send welcome email
    await withTransaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
          emailVerified: new Date(),
        },
      });
      
      // Send welcome email (don't await to avoid blocking)
      emailService.sendWelcomeEmail(user.email, user.name).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    });

    return true;
  }

  static generateAccessToken(user: User): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m'; // Shorter for access tokens
    
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        // Add a version for token invalidation ability
        version: user.passwordChangedAt ? user.passwordChangedAt.getTime() : 0,
      },
      secret,
      { 
        expiresIn,
        issuer: 'ariya-backend',
        audience: 'ariya-users'
      }
    );
  }

  static generateRefreshToken(user: User): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion || 0, // For token rotation/invalidation
      },
      secret,
      { 
        expiresIn,
        issuer: 'ariya-backend',
        audience: 'ariya-users'
      }
    );
  }

  static async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const secret = process.env.JWT_REFRESH_SECRET;
      if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is not configured');
      }
      
      const decoded = jwt.verify(refreshToken, secret) as { id: string; email: string; tokenVersion: number };

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.isSuspended || user.tokenVersion !== decoded.tokenVersion) {
        return null;
      }

      return this.generateAccessToken(user);
    } catch (error) {
      // If token is invalid/expired, return null
      return null;
    }
  }
  
  // Method to invalidate all user tokens (for password change, logout all devices)
  static async invalidateUserTokens(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user) {
      // Increment token version to invalidate all existing refresh tokens
      await prisma.user.update({
        where: { id: userId },
        data: { 
          tokenVersion: { increment: 1 },
          passwordChangedAt: new Date() // For access token invalidation
        }
      });
    }
  }
}