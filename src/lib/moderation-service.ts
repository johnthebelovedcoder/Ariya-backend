import prisma from './prisma';
import { Message, User } from '@prisma/client';

interface ContentModerationResult {
  isFlagged: boolean;
  flaggedKeywords: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

interface UserRestriction {
  userId: string;
  type: 'MESSAGING_RESTRICTION' | 'ACCOUNT_SUSPENSION' | 'FEATURE_LOCK';
  reason: string;
  expiresAt?: Date;
  isActive: boolean;
}

export class ModerationService {
  // Keywords that should trigger moderation
  private static readonly FLAGGED_KEYWORDS = [
    'whatsapp', 'send me your number', 'outside ariya', 'bank transfer', 
    'pay directly', 'gmail', 'email', 'phone', 'contact', 'personal',
    'direct payment', 'off platform', 'my number', 'contact me',
    'my contact', 'send number', 'call me', 'meet outside'
  ];

  // Check if text contains flagged content
  static scanContentForFlaggedContent(text: string): ContentModerationResult {
    const lowerText = text.toLowerCase();
    const flaggedKeywords: string[] = [];
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    
    // Check for direct flagged keywords
    for (const keyword of this.FLAGGED_KEYWORDS) {
      if (lowerText.includes(keyword.toLowerCase())) {
        flaggedKeywords.push(keyword);
      }
    }
    
    // Check for obfuscated email patterns
    const emailRegex = /\w+\s*(?:\[at\]|@|\(at\)|AT)\s*\w+\s*(?:\[dot\]|\.|\(dot\)|DOT)\s*\w+/gi;
    const obfuscatedEmails = text.match(emailRegex);
    
    if (obfuscatedEmails) {
      flaggedKeywords.push(...obfuscatedEmails.map(email => `obfuscated: ${email}`));
    }
    
    // Check for phone number patterns (obfuscated or direct)
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phoneNumbers = text.match(phoneRegex);
    
    if (phoneNumbers) {
      flaggedKeywords.push(...phoneNumbers.map(phone => `phone: ${phone}`));
    }
    
    // Additional obfuscated patterns
    const obfuscatedPatterns = [
      /\w+\s*\[\s*at\s*\]\s*\w+\s*\[\s*dot\s*\]\s*\w+/gi,  // tim[at]email[dot]com
      /\w+\s*\(\s*at\s*\)\s*\w+\s*\(\s*dot\s*\)\s*\w+/gi,  // tim(at)email(dot)com
      /\w+\s*at\s*\w+\s*dot\s*\w+/gi                       // tim at email dot com
    ];
    
    for (const pattern of obfuscatedPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        flaggedKeywords.push(...matches.map(match => `obfuscated: ${match}`));
      }
    }
    
    // Determine severity based on number of flagged items and type
    if (flaggedKeywords.length === 0) {
      return {
        isFlagged: false,
        flaggedKeywords: [],
        severity: 'LOW',
        message: 'Content is appropriate'
      };
    }
    
    // Calculate severity
    const hasPaymentTerms = flaggedKeywords.some(kw => 
      kw.includes('bank transfer') || kw.includes('pay directly') || kw.includes('direct payment')
    );
    
    const hasContactInfo = flaggedKeywords.some(kw => 
      kw.includes('phone') || kw.includes('number') || kw.includes('obfuscated')
    );
    
    if (hasPaymentTerms && hasContactInfo) {
      severity = 'HIGH';
    } else if (hasPaymentTerms || hasContactInfo || flaggedKeywords.length >= 3) {
      severity = 'MEDIUM';
    } else {
      severity = 'LOW';
    }
    
    return {
      isFlagged: true,
      flaggedKeywords,
      severity,
      message: `Content flagged with severity: ${severity}`
    };
  }

  // Process a message for moderation
  static async processMessageForModeration(messageId: string): Promise<ContentModerationResult> {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    const result = this.scanContentForFlaggedContent(message.content);
    
    if (result.isFlagged) {
      // Create a moderation report
      await prisma.moderationReport.create({
        data: {
          messageId: message.id,
          content: message.content,
          reporterId: message.senderId, // In this case, we're detecting automatically
          reportedUserId: message.senderId, // The sender is the one being reported
          reason: 'Automated content detection',
          flaggedKeywords: result.flaggedKeywords,
          severity: result.severity,
          status: 'PENDING_REVIEW',
          isAutomated: true
        }
      });
      
      // Get user's warning count to determine appropriate action
      const warningCount = await prisma.userWarning.count({
        where: { userId: message.senderId }
      });
      
      // Apply appropriate action based on severity and history
      if (result.severity === 'HIGH' || (result.severity === 'MEDIUM' && warningCount >= 1)) {
        // Issue warning first
        await this.issueAutomatedWarning(message.senderId, `Off-platform communication detected: ${result.flaggedKeywords.join(', ')}`);
        
        // Apply temporary restrictions based on severity and history
        if (result.severity === 'HIGH' || warningCount >= 2) {
          // For high severity or repeat offenses, apply stronger restrictions
          await this.applyUserRestriction(message.senderId, 'MESSAGING_RESTRICTION', 
            `High severity off-platform communication detected: ${result.flaggedKeywords.join(', ')}`, 
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          );
        } else {
          // For first-time medium offenses, issue warning and temporary restriction
          await this.applyUserRestriction(message.senderId, 'MESSAGING_RESTRICTION', 
            `Off-platform communication detected: ${result.flaggedKeywords.join(', ')}`, 
            new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
          );
        }
      } else if (result.severity === 'MEDIUM' || result.severity === 'LOW') {
        // For first-time low/medium offenses, just issue a warning
        await this.issueAutomatedWarning(message.senderId, `Potentially inappropriate content detected: ${result.flaggedKeywords.join(', ')}`);
      }
    }
    
    return result;
  }

  // Create a user report for manual review
  static async createReport(
    reporterId: string, 
    reportedUserId: string, 
    contentId: string, 
    contentType: 'message' | 'profile' | 'vendor',
    reason: string
  ) {
    const report = await prisma.moderationReport.create({
      data: {
        reporterId,
        reportedUserId,
        contentId,
        contentType,
        reason,
        status: 'PENDING_REVIEW',
        isAutomated: false
      }
    });
    
    // Check if this is a repeat offense to determine appropriate response
    const recentReports = await prisma.moderationReport.count({
      where: {
        reportedUserId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Past 30 days
        }
      }
    });
    
    // Apply escalating restrictions based on report frequency
    if (recentReports >= 3) {
      // Multiple reports - apply temporary restriction
      await this.applyUserRestriction(reportedUserId, 'MESSAGING_RESTRICTION', 
        `Multiple reports received in the past 30 days`, 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      );
    } else if (recentReports >= 1) {
      // First report - issue warning
      await this.issueAutomatedWarning(reportedUserId, `User reported by another member: ${reason}`);
    }
    
    return report;
  }

  // Get reports for review
  static async getReportsForReview(
    status: 'PENDING_REVIEW' | 'IN_REVIEW' | 'RESOLVED' = 'PENDING_REVIEW',
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    
    const [reports, total] = await Promise.all([
      prisma.moderationReport.findMany({
        where: { status },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reportedUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          message: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.moderationReport.count({ where: { status } })
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Update report status
  static async updateReportStatus(reportId: string, status: 'PENDING_REVIEW' | 'IN_REVIEW' | 'RESOLVED', reviewedBy?: string, resolutionNotes?: string) {
    const report = await prisma.moderationReport.findUnique({
      where: { id: reportId }
    });
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    const updatedReport = await prisma.moderationReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy,
        resolutionNotes,
        reviewedAt: status === 'RESOLVED' ? new Date() : undefined
      }
    });
    
    // Apply consequences based on resolution
    if (status === 'RESOLVED' && resolutionNotes?.toLowerCase().includes('violation')) {
      // If resolved as violation, check for repeat offenses
      const violationCount = await prisma.moderationReport.count({
        where: {
          reportedUserId: report.reportedUserId,
          status: 'RESOLVED',
          resolutionNotes: { contains: 'violation' }
        }
      });
      
      if (violationCount >= 3) {
        // Third violation - permanent suspension
        await this.applyUserRestriction(report.reportedUserId, 'ACCOUNT_SUSPENSION', 
          `Account suspended due to multiple violations`, 
          null // Permanent suspension
        );
      } else if (violationCount >= 2) {
        // Second violation - longer restriction
        await this.applyUserRestriction(report.reportedUserId, 'MESSAGING_RESTRICTION', 
          `Account restricted due to repeated violations`, 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        );
      }
    }
    
    return updatedReport;
  }

  // Automatically warn user
  static async issueAutomatedWarning(userId: string, reason: string) {
    // Record the warning
    const warning = await prisma.userWarning.create({
      data: {
        userId,
        reason,
        issuedBy: 'AUTOMATED_SYSTEM',
        isAutomated: true
      }
    });
    
    // In a real system, this would send a notification to the user
    // For now, we'll just record the warning
    
    return warning;
  }

  // Apply user restriction
  static async applyUserRestriction(userId: string, type: UserRestriction['type'], reason: string, expiresAt?: Date) {
    // Check if user has an existing active restriction of the same type
    const existingRestriction = await prisma.userRestriction.findFirst({
      where: {
        userId,
        type,
        isActive: true,
        OR: [
          { expiresAt: null }, // Permanent restrictions
          { expiresAt: { gte: new Date() } } // Active temporary restrictions
        ]
      }
    });
    
    // If there's already an active restriction, update it (extend duration or change reason)
    if (existingRestriction) {
      return await prisma.userRestriction.update({
        where: { id: existingRestriction.id },
        data: {
          reason,
          expiresAt: expiresAt || existingRestriction.expiresAt, // Only update if new expiry is provided
        }
      });
    }
    
    // Otherwise, create a new restriction
    return await prisma.userRestriction.create({
      data: {
        userId,
        type,
        reason,
        expiresAt: expiresAt || null, // null means permanent
        isActive: true
      }
    });
  }

  // Check if user has active restrictions
  static async getUserRestrictions(userId: string) {
    return await prisma.userRestriction.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null }, // Permanent restrictions
          { expiresAt: { gte: new Date() } } // Active temporary restrictions
        ]
      }
    });
  }

  // Check if user can perform an action
  static async canUserPerformAction(userId: string, action: 'MESSAGE' | 'BOOK' | 'CREATE_EVENT' | 'CREATE_VENDOR_PROFILE') {
    const restrictions = await this.getUserRestrictions(userId);
    
    for (const restriction of restrictions) {
      if (restriction.type === 'ACCOUNT_SUSPENSION') {
        return { canPerform: false, reason: 'Account is suspended', restriction };
      }
      
      if (restriction.type === 'MESSAGING_RESTRICTION' && action === 'MESSAGE') {
        return { canPerform: false, reason: 'Messaging is restricted', restriction };
      }
      
      if (restriction.type === 'FEATURE_LOCK' && action === 'BOOK') {
        return { canPerform: false, reason: 'Booking is restricted', restriction };
      }
    }
    
    return { canPerform: true, reason: null, restriction: null };
  }

  // Check if a user is suspended
  static async isUserSuspended(userId: string) {
    const restrictions = await prisma.userRestriction.findMany({
      where: {
        userId,
        type: 'ACCOUNT_SUSPENSION',
        isActive: true,
        OR: [
          { expiresAt: null }, // Permanent suspension
          { expiresAt: { gte: new Date() } } // Active temporary suspension
        ]
      }
    });
    
    return restrictions.length > 0;
  }

  // Remove user restriction (manual override by admin)
  static async removeUserRestriction(restrictionId: string, removedBy: string, reason?: string) {
    return await prisma.userRestriction.update({
      where: { id: restrictionId },
      data: {
        isActive: false,
        removedBy,
        removedAt: new Date(),
        removalReason: reason
      }
    });
  }

  // Get user's warning history
  static async getUserWarnings(userId: string) {
    return await prisma.userWarning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}