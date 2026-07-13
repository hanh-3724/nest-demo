import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import { I18nService } from 'nestjs-i18n';

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
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async signup(dto: SignUpRequestDto) {
    try {
      const existingUser = await this.userRepository.findUserByEmail(dto.email);

      if (existingUser) {
        throw new ConflictException(
          this.i18n.t('errors.EMAIL_ALREADY_REGISTERED'),
        );
      }

      const passwordHash = await hash(dto.password, PASSWORD_SALT_ROUNDS);
      return this.userRepository.transaction(async (repository) => {
        const user = await repository.createUser({
          email: dto.email,
          username: dto.username,
          passwordHash,
        });

        return this.createAuthResponseInTransaction(user, repository);
      });
    } catch (error) {
      this.rethrowServiceError(error, 'signup');
    }
  }

  async login(dto: SignInRequestDto) {
    try {
      const user = await this.userRepository.findUserByEmail(dto.email);

      if (!user) {
        throw new UnauthorizedException(
          this.i18n.t('errors.INVALID_CREDENTIALS'),
        );
      }

      const isPasswordValid = await compare(dto.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedException(
          this.i18n.t('errors.INVALID_CREDENTIALS'),
        );
      }

      return this.createAuthResponse(user);
    } catch (error) {
      this.rethrowServiceError(error, 'login');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      return this.userRepository.transaction(async (repository) => {
        const tokenHash = this.hashToken(refreshToken);
        const storedToken = await repository.findActiveRefreshToken(tokenHash);

        if (!storedToken) {
          throw new UnauthorizedException(
            this.i18n.t('errors.INVALID_REFRESH_TOKEN'),
          );
        }

        const user = await repository.findUserById(storedToken.userId);

        if (!user) {
          throw new UnauthorizedException(
            this.i18n.t('errors.INVALID_REFRESH_TOKEN'),
          );
        }

        await repository.revokeRefreshToken(storedToken.id);

        return this.createAuthResponseInTransaction(user, repository);
      });
    } catch (error) {
      this.rethrowServiceError(error, 'refreshToken');
    }
  }

  async updateProfile(
    userId: number,
    dto: UpdateUserProfileRequestDto,
  ): Promise<UserProfileResponseDto> {
    try {
      const user = await this.userRepository.findUserById(userId);

      if (!user) {
        throw new UnauthorizedException(this.i18n.t('errors.USER_NOT_FOUND'));
      }

      if (dto.newPassword) {
        if (!dto.currentPassword || !dto.confirmPassword) {
          throw new BadRequestException(
            this.i18n.t('errors.PASSWORD_FIELDS_REQUIRED'),
          );
        }

        if (dto.newPassword !== dto.confirmPassword) {
          throw new BadRequestException(
            this.i18n.t('errors.PASSWORD_CONFIRMATION_MISMATCH'),
          );
        }

        const isCurrentPasswordValid = await compare(
          dto.currentPassword,
          user.passwordHash,
        );

        if (!isCurrentPasswordValid) {
          throw new UnauthorizedException(
            this.i18n.t('errors.INVALID_CURRENT_PASSWORD'),
          );
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
    } catch (error) {
      this.rethrowServiceError(error, 'updateProfile');
    }
  }

  private rethrowServiceError(error: unknown, operation: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(`User service operation failed: ${operation}`, stack);

    throw new InternalServerErrorException(
      this.i18n.t('errors.INTERNAL_SERVER_ERROR'),
    );
  }

  private async createAuthResponse(user: UserRecord) {
    return this.userRepository.transaction((repository) =>
      this.createAuthResponseInTransaction(user, repository),
    );
  }

  private async createAuthResponseInTransaction(
    user: UserRecord,
    repository: UserRepository,
  ) {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id, repository);

    return {
      user: this.toUserProfile(user),
      accessToken,
      refreshToken,
    };
  }

  private async createRefreshToken(userId: number, repository: UserRepository) {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await repository.createRefreshToken({
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
