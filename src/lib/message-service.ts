import prisma from './prisma';
import { ModerationService } from './moderation-service';

interface CreateMessageInput {
  receiverId: string;
  content: string;
}

interface UpdateMessageInput {
  isRead?: boolean;
}

export class MessageService {
  // Get messages for a user (received messages)
  static async getUserMessages(
    userId: string,
    page: number = 1,
    limit: number = 10,
    isRead?: boolean
  ) {
    const skip = (page - 1) * limit;
    
    // Create where clause based on isRead parameter
    const whereClause: any = { receiverId: userId };
    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }
    
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where: whereClause })
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get messages sent by a user
  static async getUserSentMessages(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { senderId: userId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where: { senderId: userId } })
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get messages between two users
  static async getMessagesBetweenUsers(
    userId: string,
    otherUserId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
          ]
        }
      })
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get a specific message by ID
  static async getMessageById(id: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (!message) {
      return null;
    }
    
    // Check if the user has permission to access this message
    // Either they are the sender or the receiver
    if (message.senderId !== userId && message.receiverId !== userId) {
      return null;
    }
    
    return message;
  }

  // Send a new message with automated content scanning and restriction checks
  static async sendMessage(messageData: CreateMessageInput, userId: string) {
    // Verify that the sender exists
    const sender = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!sender) {
      throw new Error('Sender not found');
    }
    
    // Check if user has messaging restrictions
    const actionCheck = await ModerationService.canUserPerformAction(userId, 'MESSAGE');
    if (!actionCheck.canPerform) {
      throw new Error(`Messaging is restricted: ${actionCheck.reason}`);
    }
    
    // Verify that the receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: messageData.receiverId }
    });
    
    if (!receiver) {
      throw new Error('Receiver not found');
    }
    
    // Don't allow sending message to yourself
    if (userId === messageData.receiverId) {
      throw new Error('You cannot send a message to yourself');
    }
    
    // Create and send the message
    const createdMessage = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: messageData.receiverId,
        content: messageData.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    // Perform automated content scanning after message is created
    try {
      const scanResult = ModerationService.scanContentForFlaggedContent(messageData.content);
      if (scanResult.isFlagged) {
        // Process the flagged content - create a moderation report
        await ModerationService.processMessageForModeration(createdMessage.id);
      }
    } catch (error) {
      console.error('Error during content moderation:', error);
      // Don't throw the error as it shouldn't prevent message sending
      // Just log it for monitoring
    }
    
    return createdMessage;
  }

  // Update a message (e.g., mark as read)
  static async updateMessage(id: string, userId: string, updateData: UpdateMessageInput) {
    // Get the existing message to check permissions
    const message = await prisma.message.findUnique({
      where: { id }
    });
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Only the receiver can update the message (e.g., mark as read)
    if (message.receiverId !== userId) {
      throw new Error('Only the receiver can update this message');
    }
    
    // Update the message
    return await prisma.message.update({
      where: { id },
      data: updateData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  // Delete a message
  static async deleteMessage(id: string, userId: string) {
    // Get the existing message to check permissions
    const message = await prisma.message.findUnique({
      where: { id }
    });
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Either the sender or receiver can delete the message
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new Error('You do not have permission to delete this message');
    }
    
    return await prisma.message.delete({
      where: { id }
    });
  }

  // Mark all messages from a sender as read
  static async markMessagesAsRead(senderId: string, receiverId: string) {
    return await prisma.message.updateMany({
      where: {
        senderId,
        receiverId,
        isRead: false,
      },
      data: {
        isRead: true
      }
    });
  }

  // Get message summary (count of unread messages)
  static async getMessageSummary(userId: string) {
    const [unreadCount, sentCount, receivedCount] = await Promise.all([
      prisma.message.count({
        where: {
          receiverId: userId,
          isRead: false
        }
      }),
      prisma.message.count({
        where: {
          senderId: userId
        }
      }),
      prisma.message.count({
        where: {
          receiverId: userId
        }
      })
    ]);
    
    return {
      unread: unreadCount,
      sent: sentCount,
      received: receivedCount
    };
  }
}