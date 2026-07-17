import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 120 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
  bio: text('bio').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('refresh_tokens_user_id_idx').on(table.userId)],
);

export const articles = pgTable(
  'articles',
  {
    id: serial('id').primaryKey(),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    shortDescription: varchar('short_description', { length: 500 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('articles_author_id_idx').on(table.authorId)],
);

export const articleComments = pgTable(
  'article_comments',
  {
    id: serial('id').primaryKey(),
    articleId: integer('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    commentorId: integer('commentor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('article_comments_article_id_idx').on(table.articleId),
    index('article_comments_commentor_id_idx').on(table.commentorId),
  ],
);

export const articleFavorites = pgTable(
  'article_favorites',
  {
    articleId: integer('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.userId] }),
    index('article_favorites_user_id_idx').on(table.userId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type ArticleComment = typeof articleComments.$inferSelect;
