import { Body, Controller, Patch, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  AuthResponseDto,
  RefreshTokenRequestDto,
  SignInRequestDto,
  SignUpRequestDto,
} from './dto/auth.dto';
import {
  UpdateUserProfileRequestDto,
  UserProfileResponseDto,
} from './dto/user.dto';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedRequest } from './user.types';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @Public()
  @ApiCreatedResponse({ type: AuthResponseDto })
  signup(@Body() dto: SignUpRequestDto): Promise<AuthResponseDto> {
    return this.userService.signup(dto);
  }

  @Post('login')
  @Public()
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: SignInRequestDto): Promise<AuthResponseDto> {
    return this.userService.login(dto);
  }

  @Post('refresh-token')
  @Public()
  @ApiOkResponse({ type: AuthResponseDto })
  refreshToken(@Body() dto: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    return this.userService.refreshToken(dto.refreshToken);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserProfileResponseDto })
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateUserProfileRequestDto,
  ): Promise<UserProfileResponseDto> {
    return this.userService.updateProfile(request.user.sub, dto);
  }
}
