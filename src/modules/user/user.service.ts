import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';

import { SignInRequestDto, SignUpRequestDto } from './dto/auth.dto';
import {
  UpdateUserProfileRequestDto,
  UserProfileResponseDto,
} from './dto/user.dto';
import {
  UserRepository,
  type UserRecord,
  type UserUpdateValues,
} from './user.repository';
import type { JwtUserPayload } from './user.types';

const ACCESS_TOKEN_TTL = '3d';
const REFRESH_TOKEN_TTL_DAYS = 30;
const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignUpRequestDto) {
    const existingUser = await this.userRepository.findUserByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await hash(dto.password, PASSWORD_SALT_ROUNDS);
    const user = await this.userRepository.createUser({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });

    return this.createAuthResponse(user);
  }

  async login(dto: SignInRequestDto) {
    const user = await this.userRepository.findUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user);
  }

  async refreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken =
      await this.userRepository.findActiveRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.userRepository.revokeRefreshToken(storedToken.id);

    const user = await this.userRepository.findUserById(storedToken.userId);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.createAuthResponse(user);
  }

  async updateProfile(
    userId: number,
    dto: UpdateUserProfileRequestDto,
  ): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.newPassword) {
      if (!dto.currentPassword || !dto.confirmPassword) {
        throw new BadRequestException(
          'currentPassword and confirmPassword are required',
        );
      }

      if (dto.newPassword !== dto.confirmPassword) {
        throw new BadRequestException(
          'New password confirmation does not match',
        );
      }

      const isCurrentPasswordValid = await compare(
        dto.currentPassword,
        user.passwordHash,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is invalid');
      }
    }

    const updateValues: UserUpdateValues = {
      updatedAt: new Date(),
    };

    if (dto.username !== undefined) {
      updateValues.username = dto.username;
    }

    if (dto.avatar !== undefined) {
      updateValues.avatar = dto.avatar;
    }

    if (dto.bio !== undefined) {
      updateValues.bio = dto.bio;
    }

    if (dto.newPassword) {
      updateValues.passwordHash = await hash(
        dto.newPassword,
        PASSWORD_SALT_ROUNDS,
      );
    }

    const updatedUser = await this.userRepository.updateUser(
      userId,
      updateValues,
    );

    return this.toUserProfile(updatedUser);
  }

  private async createAuthResponse(user: UserRecord) {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: this.toUserProfile(user),
      accessToken,
      refreshToken,
    };
  }

  private async createRefreshToken(userId: number) {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.userRepository.createRefreshToken({
      userId,
      tokenHash: this.hashToken(token),
      expiresAt,
    });

    return token;
  }

  private async signAccessToken(user: UserRecord) {
    const payload: JwtUserPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_TOKEN_TTL',
        ACCESS_TOKEN_TTL,
      ) as never,
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private toUserProfile(user: UserRecord): UserProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
    };
  }
}
