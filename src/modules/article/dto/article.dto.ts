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

export class CreateArticleRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdateArticleRequestDto extends PartialType(
  CreateArticleRequestDto,
) {}

export class ArticlePaginationQueryDto {
  @ApiProperty({ default: 1, minimum: 1, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({ default: 3, minimum: 1, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size = 3;
}

export class ArticleDetailResponseDto {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty()
  @IsBoolean()
  isFavorite: boolean;

  @ApiProperty({ description: 'Number of users who favorited this article' })
  @IsInt()
  @Min(0)
  favoriteBy: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  totalComments: number;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
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
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({ default: 3, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size = 3;

  @ApiProperty()
  @IsInt()
  @Min(0)
  total: number;
}

export class CreateCommentRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class CommentResponseDto {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  commentor: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({ type: Date })
  @IsDate()
  createdAt: Date;
}

export class ToggleFavoriteResponseDto {
  @ApiProperty()
  @IsBoolean()
  isFavorite: boolean;
}
