import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateArticleRequestDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  title: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  shortDescription: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  content: string;
}

export class UpdateArticleRequestDto extends PartialType(
  CreateArticleRequestDto,
) {}

export class ArticlePaginationQueryDto {
  @ApiProperty({ default: 1, minimum: 1, required: false })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  page = 1;

  @ApiProperty({ default: 3, minimum: 1, required: false })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  size = 3;
}

export class ArticleDetailResponseDto {
  @ApiProperty()
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  id: number;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  title: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  shortDescription: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  author: string;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isFavorite: boolean;

  @ApiProperty({ description: 'Number of users who favorited this article' })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  favoriteBy: number;

  @ApiProperty()
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  totalComments: number;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  content: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_DATE') })
  createdAt: string;

  @ApiProperty({ type: () => [CommentResponseDto] })
  @ValidateNested({ each: true })
  @Type(() => CommentResponseDto)
  comments: CommentResponseDto[];
}

export class ArticleResponseDto {
  @ApiProperty({ type: () => [ArticleDetailResponseDto] })
  @ValidateNested({ each: true })
  @Type(() => ArticleDetailResponseDto)
  articles: ArticleDetailResponseDto[];

  @ApiProperty({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  page = 1;

  @ApiProperty({ default: 3, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  size = 3;

  @ApiProperty()
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  total: number;
}

export class CreateCommentRequestDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  comment: string;
}

export class CommentResponseDto {
  @ApiProperty()
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  id: number;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  commentor: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  comment: string;

  @ApiProperty({ type: Date })
  @IsDate({ message: i18nValidationMessage('validation.IS_DATE') })
  createdAt: Date;
}

export class ToggleFavoriteResponseDto {
  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isFavorite: boolean;
}
