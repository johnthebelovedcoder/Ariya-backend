import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the exception
    this.logger.error(
      `Exception occurred: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : '',
      'AllExceptionsFilter',
    );

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseObj = exception.getResponse();
      
      if (typeof responseObj === 'object' && responseObj !== null) {
        message = (responseObj as any).message || exception.message;
        error = (responseObj as any).error || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    });
  }
}