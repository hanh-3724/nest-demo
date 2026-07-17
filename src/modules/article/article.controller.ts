import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import type {
  AuthenticatedRequest,
  OptionalAuthenticatedRequest,
} from '../user/user.types';
import {
  ArticleDetailResponseDto,
  ArticlePaginationQueryDto,
  ArticleResponseDto,
  CommentResponseDto,
  CreateArticleRequestDto,
  CreateCommentRequestDto,
  ToggleFavoriteResponseDto,
  UpdateArticleRequestDto,
} from './dto/article.dto';
import { ArticleService } from './article.service';

@ApiTags('articles')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @OptionalAuth()
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleResponseDto })
  getAll(
    @Query() query: ArticlePaginationQueryDto,
    @Req() request: OptionalAuthenticatedRequest,
  ) {
    return this.articleService.getAll(
      query.page,
      query.size,
      request.user?.sub,
    );
  }

  @Get(':id')
  @Public()
  @ApiOkResponse({ type: ArticleDetailResponseDto })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.getById(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ArticleDetailResponseDto })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateArticleRequestDto,
  ) {
    return this.articleService.create(request.user.sub, dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleDetailResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateArticleRequestDto,
  ) {
    return this.articleService.update(id, request.user.sub, dto);
  }

  @Post(':id/comments')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: CommentResponseDto })
  createComment(
    @Param('id', ParseIntPipe) articleId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCommentRequestDto,
  ) {
    return this.articleService.createComment(
      articleId,
      request.user.sub,
      dto.comment,
    );
  }

  @Patch(':id/favorite')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ToggleFavoriteResponseDto })
  toggleFavoriteArticle(
    @Param('id', ParseIntPipe) articleId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.articleService.toggleFavoriteArticle(
      articleId,
      request.user.sub,
    );
  }
}
