import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import {
  ArticleDetailResponseDto,
  ArticleResponseDto,
  CommentResponseDto,
  CreateArticleRequestDto,
  UpdateArticleRequestDto,
} from './dto/article.dto';
import { ArticleRepository } from './article.repository';

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);

  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly i18n: I18nService,
  ) {}

  async create(
    authorId: number,
    dto: CreateArticleRequestDto,
  ): Promise<ArticleDetailResponseDto> {
    try {
      const article = await this.articleRepository.createArticle({
        authorId,
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content,
      });

      return this.getById(article.id, authorId);
    } catch (error) {
      this.rethrowServiceError(error, 'create');
    }
  }

  async getAll(
    page: number,
    size: number,
    userId?: number,
  ): Promise<ArticleResponseDto> {
    try {
      const result = await this.articleRepository.findArticles(
        page,
        size,
        userId,
      );
      const comments = await this.articleRepository.findCommentsByArticleIds(
        result.articles.map((article) => article.id),
      );
      const commentsByArticleId = new Map<number, CommentResponseDto[]>();

      for (const { articleId, ...comment } of comments) {
        const articleComments = commentsByArticleId.get(articleId) ?? [];
        articleComments.push(comment);
        commentsByArticleId.set(articleId, articleComments);
      }

      const articles = result.articles.map((article) => ({
        ...this.mapArticle(article),
        comments: commentsByArticleId.get(article.id) ?? [],
      }));

      return { articles, page, size, total: result.total };
    } catch (error) {
      this.rethrowServiceError(error, 'getAll');
    }
  }

  async getById(
    id: number,
    userId?: number,
  ): Promise<ArticleDetailResponseDto> {
    try {
      const article = await this.articleRepository.findArticleById(id, userId);

      if (!article) {
        throw new NotFoundException(this.i18n.t('errors.ARTICLE_NOT_FOUND'));
      }

      const comments = await this.articleRepository.findComments(id);
      return { ...this.mapArticle(article), comments };
    } catch (error) {
      this.rethrowServiceError(error, 'getById');
    }
  }

  async update(
    id: number,
    authorId: number,
    dto: UpdateArticleRequestDto,
  ): Promise<ArticleDetailResponseDto> {
    try {
      await this.assertArticleOwner(id, authorId);
      await this.articleRepository.updateArticle(id, authorId, dto);
      return this.getById(id, authorId);
    } catch (error) {
      this.rethrowServiceError(error, 'update');
    }
  }

  async delete(id: number, authorId: number): Promise<void> {
    try {
      await this.assertArticleOwner(id, authorId);
      await this.articleRepository.deleteArticle(id, authorId);
    } catch (error) {
      this.rethrowServiceError(error, 'delete');
    }
  }

  async createComment(
    articleId: number,
    commentorId: number,
    content: string,
  ): Promise<CommentResponseDto> {
    try {
      await this.assertArticleExists(articleId);
      const created = await this.articleRepository.createComment(
        articleId,
        commentorId,
        content,
      );
      const comment = await this.articleRepository.findCommentById(created.id);

      if (!comment) {
        throw new NotFoundException(this.i18n.t('errors.COMMENT_NOT_FOUND'));
      }

      return comment;
    } catch (error) {
      this.rethrowServiceError(error, 'createComment');
    }
  }

  async deleteComment(commentId: number, commentorId: number): Promise<void> {
    try {
      const deleted = await this.articleRepository.deleteComment(
        commentId,
        commentorId,
      );

      if (!deleted) {
        throw new NotFoundException(this.i18n.t('errors.COMMENT_NOT_FOUND'));
      }
    } catch (error) {
      this.rethrowServiceError(error, 'deleteComment');
    }
  }

  async toggleFavoriteArticle(
    articleId: number,
    userId: number,
  ): Promise<{ isFavorite: boolean }> {
    try {
      await this.assertArticleExists(articleId);
      const isFavorite = await this.articleRepository.toggleFavoriteArticle(
        articleId,
        userId,
      );

      return { isFavorite };
    } catch (error) {
      this.rethrowServiceError(error, 'toggleFavoriteArticle');
    }
  }

  private async assertArticleExists(id: number) {
    const article = await this.articleRepository.findArticleById(id);
    if (!article) {
      throw new NotFoundException(this.i18n.t('errors.ARTICLE_NOT_FOUND'));
    }

    return article;
  }

  private async assertArticleOwner(id: number, userId: number) {
    const article = await this.assertArticleExists(id);
    if (article.authorId !== userId) {
      throw new ForbiddenException(this.i18n.t('errors.ARTICLE_FORBIDDEN'));
    }
  }

  private mapArticle(article: {
    id: number;
    title: string;
    shortDescription: string;
    content: string;
    author: string;
    createdAt: Date;
    isFavorite: boolean;
    favoriteBy: number;
    totalComments: number;
  }) {
    return {
      id: article.id,
      title: article.title,
      shortDescription: article.shortDescription,
      content: article.content,
      author: article.author,
      createdAt: article.createdAt.toISOString(),
      isFavorite: article.isFavorite,
      favoriteBy: article.favoriteBy,
      totalComments: article.totalComments,
    };
  }

  private rethrowServiceError(error: unknown, operation: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(`Article service operation failed: ${operation}`, stack);
    throw new InternalServerErrorException(
      this.i18n.t('errors.INTERNAL_SERVER_ERROR'),
    );
  }
}
