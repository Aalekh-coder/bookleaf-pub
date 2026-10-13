
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const password = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password,
        },
        select: {
          id: true,
          email: true,
          role: true,
          tokenVersion: true,
        },
      });

      return {
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        accessToken: await this.signToken(user),
      };
    } catch (error) {
      // Handles duplicate email, including concurrent registrations.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(dto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken: await this.signToken(user),
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    return {
      message: 'Logged out successfully',
    };
  }

  private signToken(user: {
    id: string;
    email: string;
    role: string;
    tokenVersion: number;
  }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
  }
}
