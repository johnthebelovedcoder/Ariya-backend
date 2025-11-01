import prisma from '../prisma';

export class AdminAuthService {
  // Verify if user has admin privileges
  static async verifyAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    return user?.role === 'ADMIN';
  }
}