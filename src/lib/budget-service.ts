import prisma from './prisma';
import { Budget } from '@prisma/client';

interface CreateBudgetInput {
  eventId: string;
  category: string;
  allocated: number;
  notes?: string;
}

interface UpdateBudgetInput {
  allocated?: number;
  actual?: number;
  notes?: string;
}

export class BudgetService {
  // Get all budget items for an event
  static async getEventBudgets(eventId: string, userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to access it');
    }
    
    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where: { eventId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              date: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.budget.count({ where: { eventId } })
    ]);

    return {
      budgets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get budget item by ID
  static async getBudgetById(id: string, userId: string) {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!budget) {
      return null;
    }
    
    // Check if the user has permission to access this budget item
    if (budget.event.userId !== userId) {
      return null;
    }
    
    return budget;
  }

  // Create a new budget item
  static async createBudget(budgetData: CreateBudgetInput, userId: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: budgetData.eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to budget for it');
    }

    // Check if a budget item already exists for this event and category
    const existingBudget = await prisma.budget.findFirst({
      where: {
        eventId: budgetData.eventId,
        category: budgetData.category,
      }
    });
    
    if (existingBudget) {
      throw new Error('A budget item already exists for this event and category');
    }

    // Get user's currency for the budget
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true }
    });

    // Calculate remaining budget - in the future, we might want to include currency considerations
    return await prisma.budget.create({
      data: {
        eventId: budgetData.eventId,
        category: budgetData.category,
        allocated: budgetData.allocated,
        actual: 0, // Start with 0 actual spending
        notes: budgetData.notes,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          }
        }
      }
    });
  }

  // Update a budget item
  static async updateBudget(id: string, userId: string, updateData: UpdateBudgetInput) {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!budget) {
      throw new Error('Budget item not found');
    }
    
    // Check if the user has permission to update this budget item
    if (budget.event.userId !== userId) {
      throw new Error('You do not have permission to update this budget item');
    }

    // Prevent reducing allocated amount if actual spending exceeds the new allocation
    if (updateData.allocated !== undefined && updateData.allocated < budget.actual) {
      throw new Error('Cannot reduce allocated amount below actual spending');
    }

    return await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          }
        }
      }
    });
  }

  // Delete a budget item
  static async deleteBudget(id: string, userId: string) {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!budget) {
      throw new Error('Budget item not found');
    }
    
    // Check if the user has permission to delete this budget item
    if (budget.event.userId !== userId) {
      throw new Error('You do not have permission to delete this budget item');
    }

    // Prevent deletion if there's actual spending
    if (budget.actual > 0) {
      throw new Error('Cannot delete budget item with actual spending recorded');
    }

    return await prisma.budget.delete({
      where: { id }
    });
  }

  // Update actual spending for a budget item
  static async updateActualSpending(budgetId: string, eventId: string, userId: string, amount: number) {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission');
    }

    // Verify budget item belongs to this event
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId }
    });

    if (!budget || budget.eventId !== eventId) {
      throw new Error('Budget item not found or does not belong to this event');
    }

    // Update the actual spending
    return await prisma.budget.update({
      where: { id: budgetId },
      data: {
        actual: {
          increment: amount // Add to the current actual spending
        }
      }
    });
  }

  // Get budget summary for an event
  static async getBudgetSummary(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission');
    }

    const budgets = await prisma.budget.findMany({
      where: { eventId }
    });

    const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
    const totalActual = budgets.reduce((sum, budget) => sum + budget.actual, 0);
    const remaining = totalAllocated - totalActual;

    return {
      eventId,
      totalAllocated,
      totalActual,
      remaining,
      budgetItems: budgets,
      summary: `Event budget: ₦${totalAllocated.toLocaleString()} allocated, ₦${totalActual.toLocaleString()} spent, ₦${remaining.toLocaleString()} remaining`
    };
  }
}