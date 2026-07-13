/// <reference types="node" />

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5543),
    database: process.env.DB_NAME ?? "nestJs_demo_db",
    user: process.env.DB_USERNAME ?? "admin",
    password: process.env.DB_PASSWORD ?? "postgre",
  },
});
