import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'name', 'phone', 'city', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'author@example.com',
        },
        name: {
          type: 'string',
          example: 'Alex Author',
        },
        phone: {
          type: 'string',
          example: '+1-555-0100',
        },
        city: {
          type: 'string',
          example: 'New York',
        },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 72,
          example: 'strong-password',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Account created successfully',
    schema: {
      example: {
        message: 'Account created successfully',
        user: {
          id: 'clx1234567890',
          email: 'author@example.com',
          name: 'Alex Author',
          phone: '+1-555-0100',
          city: 'New York',
          role: 'AUTHOR',
        },
        accessToken: 'JWT access token',
      },
    },
  })
  @ApiConflictResponse({
    description: 'An account with this email already exists',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in to an account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'author@example.com',
        },
        password: {
          type: 'string',
          maxLength: 72,
          example: 'strong-password',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Login successful',
    schema: {
      example: {
        message: 'Login successful',
        user: {
          id: 'clx1234567890',
          email: 'author@example.com',
          name: 'Alex Author',
          role: 'AUTHOR',
        },
        accessToken: 'JWT access token',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      message: result.message,
      user: result.user,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log out of the authenticated account' })
  @ApiCreatedResponse({
    description: 'Logged out successfully',
    schema: { example: { message: 'Logged out successfully' } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  logout(
    @Req() req: { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return this.authService.logout(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated account' })
  @ApiOkResponse({
    description: 'Authenticated account details',
    schema: {
      example: {
        id: 'clx1234567890',
        email: 'author@example.com',
        name: 'Alex Author',
        role: 'AUTHOR',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  me(
    @Req()
    req: {
      user: { id: string; email: string; name: string; role: string };
    },
  ) {
    return req.user;
  }
}
