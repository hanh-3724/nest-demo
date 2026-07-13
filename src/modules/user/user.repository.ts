import { Injectable, Optional } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DbService } from '../../db/db.service';
import * as schema from '../../db/schema';

export type UserRecord = schema.User;
export type UserUpdateValues = Partial<typeof schema.users.$inferInsert>;
type Database = NodePgDatabase<typeof schema>;
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
type DatabaseExecutor = Database | Transaction;

@Injectable()
export class UserRepository {
  constructor(
    private readonly dbService: DbService,
    @Optional() private readonly executor?: DatabaseExecutor,
  ) {}

  private get db(): DatabaseExecutor {
    return this.executor ?? this.dbService.db;
  }

  async transaction<T>(
    callback: (repository: UserRepository) => Promise<T>,
  ): Promise<T> {
    return this.dbService.db.transaction((transaction) =>
      callback(new UserRepository(this.dbService, transaction)),
    );
  }

  async createUser(values: typeof schema.users.$inferInsert) {
    const [user] = await this.db
      .insert(schema.users)
      .values(values)
      .returning();

    return user;
  }

  async findUserByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    return user;
  }

  async findUserById(id: number) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return user;
  }

  async updateUser(id: number, values: UserUpdateValues) {
    const [user] = await this.db
      .update(schema.users)
      .set(values)
      .where(eq(schema.users.id, id))
      .returning();

    return user;
  }

  async createRefreshToken(values: typeof schema.refreshTokens.$inferInsert) {
    const [refreshToken] = await this.db
      .insert(schema.refreshTokens)
      .values(values)
      .returning();

    return refreshToken;
  }

  async findActiveRefreshToken(tokenHash: string, now = new Date()) {
    const [refreshToken] = await this.db
      .select()
      .from(schema.refreshTokens)
      .where(
        and(
          eq(schema.refreshTokens.tokenHash, tokenHash),
          isNull(schema.refreshTokens.revokedAt),
          gt(schema.refreshTokens.expiresAt, now),
        ),
      )
      .limit(1)
      .for('update');

    return refreshToken;
  }

  async revokeRefreshToken(id: number) {
    await this.db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.id, id));
  }
}
