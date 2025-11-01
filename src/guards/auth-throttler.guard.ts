import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  // Custom throttler guard for authentication endpoints
}