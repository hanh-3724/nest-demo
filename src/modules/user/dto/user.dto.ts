import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

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
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(20, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  username?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  avatar?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  bio?: string;

  @ApiProperty({ required: false })
  @ValidateIf((body: UpdateUserProfileRequestDto) => Boolean(body.newPassword))
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  currentPassword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(8, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  newPassword?: string;

  @ApiProperty({ required: false })
  @ValidateIf((body: UpdateUserProfileRequestDto) => Boolean(body.newPassword))
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(8, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  confirmPassword?: string;
}
