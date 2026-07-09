import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { DRIZZLE_DB } from './db.constants';
import * as schema from './schema';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DB,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get<string>('DB_HOST', process.env.DB_HOST || 'localhost'),
          port: Number(configService.get<string>('DB_PORT', process.env.DB_PORT || '5543')),
          database: configService.get<string>('DB_NAME', process.env.DB_NAME || 'nestJs_demo_db'),
          user: configService.get<string>('DB_USERNAME', process.env.DB_USERNAME || 'admin'),
          password: configService.get<string>('DB_PASSWORD', process.env.DB_PASSWORD || 'postgre'),
        });

        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE_DB],
})
export class DbModule {}
