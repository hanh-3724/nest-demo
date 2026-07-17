import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UserProfileResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ required: false, nullable: true })
  avatar: string | null;

  @ApiProperty()
  bio: string;
}

export class UpdateUserProfileRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  username?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @ValidateIf((body: UpdateUserProfileRequestDto) => Boolean(body.newPassword))
  @IsString()
  currentPassword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;

  @ApiProperty({ required: false })
  @ValidateIf((body: UpdateUserProfileRequestDto) => Boolean(body.newPassword))
  @IsString()
  @MinLength(8)
  confirmPassword?: string;
}
