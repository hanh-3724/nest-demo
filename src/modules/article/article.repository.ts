import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import * as schema from '../../db/schema';

@Injectable()
export class ArticleRepository {
  constructor(private readonly dbService: DbService) {}

  async createArticle(values: typeof schema.articles.$inferInsert) {
    const [article] = await this.dbService.db
      .insert(schema.articles)
      .values(values)
      .returning();

    return article;
  }

  async findArticles(page: number, size: number, userId?: number) {
    const offset = (page - 1) * size;
    const isFavorite = userId
      ? sql<boolean>`exists(
          select 1 from ${schema.articleFavorites}
          where ${schema.articleFavorites.articleId} = ${schema.articles.id}
            and ${schema.articleFavorites.userId} = ${userId}
        )`
      : sql<boolean>`false`;

    const articles = await this.dbService.db
      .select({
        id: schema.articles.id,
        title: schema.articles.title,
        shortDescription: schema.articles.shortDescription,
        content: schema.articles.content,
        author: schema.users.username,
        createdAt: schema.articles.createdAt,
        isFavorite,
        favoriteBy: sql<number>`(
          select count(*)::int from ${schema.articleFavorites}
          where ${schema.articleFavorites.articleId} = ${schema.articles.id}
        )`,
        totalComments: sql<number>`(
          select count(*)::int from ${schema.articleComments}
          where ${schema.articleComments.articleId} = ${schema.articles.id}
        )`,
      })
      .from(schema.articles)
      .innerJoin(schema.users, eq(schema.articles.authorId, schema.users.id))
      .orderBy(desc(schema.articles.createdAt))
      .limit(size)
      .offset(offset);

    const [{ total }] = await this.dbService.db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.articles);

    return { articles, total };
  }

  async findArticleById(id: number, userId?: number) {
    const isFavorite = userId
      ? sql<boolean>`exists(
          select 1 from ${schema.articleFavorites}
          where ${schema.articleFavorites.articleId} = ${schema.articles.id}
            and ${schema.articleFavorites.userId} = ${userId}
        )`
      : sql<boolean>`false`;

    const [article] = await this.dbService.db
      .select({
        id: schema.articles.id,
        authorId: schema.articles.authorId,
        title: schema.articles.title,
        shortDescription: schema.articles.shortDescription,
        content: schema.articles.content,
        author: schema.users.username,
        createdAt: schema.articles.createdAt,
        isFavorite,
        favoriteBy: sql<number>`(
          select count(*)::int from ${schema.articleFavorites}
          where ${schema.articleFavorites.articleId} = ${schema.articles.id}
        )`,
        totalComments: sql<number>`(
          select count(*)::int from ${schema.articleComments}
          where ${schema.articleComments.articleId} = ${schema.articles.id}
        )`,
      })
      .from(schema.articles)
      .innerJoin(schema.users, eq(schema.articles.authorId, schema.users.id))
      .where(eq(schema.articles.id, id))
      .limit(1);

    return article;
  }

  async updateArticle(
    id: number,
    authorId: number,
    values: Partial<typeof schema.articles.$inferInsert>,
  ) {
    const [article] = await this.dbService.db
      .update(schema.articles)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(schema.articles.id, id), eq(schema.articles.authorId, authorId)),
      )
      .returning();

    return article;
  }

  async deleteArticle(id: number, authorId: number) {
    const [article] = await this.dbService.db
      .delete(schema.articles)
      .where(
        and(eq(schema.articles.id, id), eq(schema.articles.authorId, authorId)),
      )
      .returning({ id: schema.articles.id });

    return article;
  }

  async findComments(articleId: number) {
    return this.dbService.db
      .select({
        id: schema.articleComments.id,
        commentor: schema.users.username,
        comment: schema.articleComments.content,
        createdAt: schema.articleComments.createdAt,
      })
      .from(schema.articleComments)
      .innerJoin(
        schema.users,
        eq(schema.articleComments.commentorId, schema.users.id),
      )
      .where(eq(schema.articleComments.articleId, articleId))
      .orderBy(desc(schema.articleComments.createdAt));
  }

  async createComment(articleId: number, commentorId: number, content: string) {
    const [comment] = await this.dbService.db
      .insert(schema.articleComments)
      .values({ articleId, commentorId, content })
      .returning();

    return comment;
  }

  async findCommentById(id: number) {
    const [comment] = await this.dbService.db
      .select({
        id: schema.articleComments.id,
        commentor: schema.users.username,
        comment: schema.articleComments.content,
        createdAt: schema.articleComments.createdAt,
      })
      .from(schema.articleComments)
      .innerJoin(
        schema.users,
        eq(schema.articleComments.commentorId, schema.users.id),
      )
      .where(eq(schema.articleComments.id, id))
      .limit(1);

    return comment;
  }

  async deleteComment(id: number, commentorId: number) {
    const [comment] = await this.dbService.db
      .delete(schema.articleComments)
      .where(
        and(
          eq(schema.articleComments.id, id),
          eq(schema.articleComments.commentorId, commentorId),
        ),
      )
      .returning({ id: schema.articleComments.id });

    return comment;
  }

  async toggleFavoriteArticle(articleId: number, userId: number) {
    return this.dbService.db.transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(${articleId}, ${userId})`,
      );

      const [favorite] = await transaction
        .select({ articleId: schema.articleFavorites.articleId })
        .from(schema.articleFavorites)
        .where(
          and(
            eq(schema.articleFavorites.articleId, articleId),
            eq(schema.articleFavorites.userId, userId),
          ),
        )
        .limit(1);

      if (favorite) {
        await transaction
          .delete(schema.articleFavorites)
          .where(
            and(
              eq(schema.articleFavorites.articleId, articleId),
              eq(schema.articleFavorites.userId, userId),
            ),
          );

        return false;
      }

      await transaction
        .insert(schema.articleFavorites)
        .values({ articleId, userId });

      return true;
    });
  }
}
