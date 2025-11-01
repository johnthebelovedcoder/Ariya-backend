import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account suspended or not verified' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.login({
        email: loginDto.email,
        password: loginDto.password,
        rememberMe: loginDto.rememberMe,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            isVerified: result.user.isVerified,
            createdAt: result.user.createdAt,
            updatedAt: result.user.updatedAt,
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      // Handle specific authentication errors
      if (error.message === 'Invalid credentials') {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (error.message === 'Account not verified') {
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: 'Please verify your email before logging in',
        });
      }

      if (error.message === 'Account suspended') {
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: 'Your account has been suspended. Please contact support.',
        });
      }

      if (error.message === 'Account temporarily locked due to multiple failed login attempts') {
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: 'Account temporarily locked. Please try again later.',
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An unexpected error occurred during login',
      });
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.register({
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password,
      });

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return res.status(HttpStatus.CONFLICT).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An unexpected error occurred during registration',
      });
    }
  }
}