import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Process a new payment' })
  @ApiBody({ description: 'Payment data' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  async processPayment(@Body() paymentData: any) {
    return await this.paymentsService.processPayment(paymentData);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Return payment information' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id') id: string) {
    const payment = await this.paymentsService.getPaymentById(id);
    
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    return {
      success: true,
      data: payment,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all payments for authenticated user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Return paginated payments' })
  async getUserPayments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // Get user ID from request (in a real implementation, you'd get this from the JWT)
    // For now, I'll use a placeholder - in a real app you'd have a decorator to get user from JWT
    const userId = 'placeholder-user-id'; // This would come from the JWT payload
    
    // Ensure limits are within acceptable range
    limit = Math.min(limit, 100); // Max 100 items per page
    
    return await this.paymentsService.getUserPayments(userId, Number(page), Number(limit));
  }
}