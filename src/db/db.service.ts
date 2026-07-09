import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

@Injectable()
export class DbService implements OnModuleDestroy {
  private pool?: Pool;
  private database?: NodePgDatabase<typeof schema>;

  constructor(private readonly configService: ConfigService) {}

  get db(): NodePgDatabase<typeof schema> {
    if (!this.database) {
      this.database = this.createDatabase();
    }

    return this.database;
  }

  private createDatabase(): NodePgDatabase<typeof schema> {
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: Number(this.configService.get<string>('DB_PORT', '5543')),
      database: this.configService.get<string>('DB_NAME', 'nestJs_demo_db'),
      user: this.configService.get<string>('DB_USERNAME', 'admin'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgre'),
    });

    return drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
