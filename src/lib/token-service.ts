import crypto from 'crypto';
import prisma from './prisma';
import Logger from './logger-service';

/**
 * Service for managing verification and reset tokens
 */

export type TokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export class TokenService {
  /**
   * Generate a cryptographically secure random token
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a verification token
   */
  static async createToken(
    userId: string,
    type: TokenType,
    expiresInMinutes: number = 60
  ): Promise<string> {
    try {
      const token = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      // Delete any existing unused tokens of the same type for this user
      await prisma.verificationToken.deleteMany({
        where: {
          userId,
          type,
          usedAt: null,
        },
      });

      // Create new token
      await prisma.verificationToken.create({
        data: {
          userId,
          token,
          type,
          expiresAt,
        },
      });

      Logger.info('Verification token created', {
        userId,
        type,
        expiresAt: expiresAt.toISOString(),
      });

      return token;
    } catch (error) {
      Logger.error('Failed to create verification token', {
        userId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to create verification token');
    }
  }

  /**
   * Verify and consume a token
   * Returns the user ID if valid, null otherwise
   */
  static async verifyAndConsumeToken(
    token: string,
    type: TokenType
  ): Promise<string | null> {
    try {
      // Find the token
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          token,
          type,
          usedAt: null, // Not already used
        },
        include: {
          user: true,
        },
      });

      // Token not found
      if (!verificationToken) {
        Logger.warn('Token not found or already used', { token: token.substring(0, 8), type });
        return null;
      }

      // Token expired
      if (new Date() > verificationToken.expiresAt) {
        Logger.warn('Token expired', {
          token: token.substring(0, 8),
          type,
          expiresAt: verificationToken.expiresAt,
        });
        return null;
      }

      // Mark token as used
      await prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });

      Logger.info('Token verified and consumed', {
        userId: verificationToken.userId,
        type,
      });

      return verificationToken.userId;
    } catch (error) {
      Logger.error('Failed to verify token', {
        token: token.substring(0, 8),
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.verificationToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      Logger.info('Expired tokens cleaned up', { count: result.count });
      return result.count;
    } catch (error) {
      Logger.error('Failed to cleanup expired tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Check if a token is valid (without consuming it)
   */
  static async isTokenValid(token: string, type: TokenType): Promise<boolean> {
    try {
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          token,
          type,
          usedAt: null,
        },
      });

      if (!verificationToken) {
        return false;
      }

      return new Date() <= verificationToken.expiresAt;
    } catch (error) {
      Logger.error('Failed to check token validity', {
        token: token.substring(0, 8),
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get token info without consuming it
   */
  static async getTokenInfo(token: string, type: TokenType) {
    try {
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          token,
          type,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      if (!verificationToken) {
        return null;
      }

      return {
        userId: verificationToken.userId,
        user: verificationToken.user,
        expiresAt: verificationToken.expiresAt,
        isExpired: new Date() > verificationToken.expiresAt,
        isUsed: verificationToken.usedAt !== null,
        usedAt: verificationToken.usedAt,
      };
    } catch (error) {
      Logger.error('Failed to get token info', {
        token: token.substring(0, 8),
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}

export default TokenService;
