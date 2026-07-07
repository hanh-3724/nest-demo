# Nest Demo

Simple NestJS backend project with Docker Compose support for PostgreSQL.

## Requirements

- Node.js 24+
- npm
- Docker and Docker Compose

## Environment

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

For Docker Compose, use:

```env
APP_PORT=3636
JWT_SECRET=replace-with-a-long-random-local-secret

DB_HOST=nestjs-demo-postgres
DB_PORT=5432
DB_NAME=nestJs_demo_db
DB_USERNAME=admin
DB_PASSWORD=postgre
```

`DB_HOST=nestjs-demo-postgres` is required when the backend runs inside Docker, because `nestjs-demo-postgres` is the Compose service name.

## Run With Docker

Start the backend and PostgreSQL:

```bash
docker compose up --build
```

The backend will be available at:

```text
http://localhost:3636
```

PostgreSQL will be available from your host machine at:

```text
localhost:5543
```

Stop the containers:

```bash
docker compose down
```

## Run Backend Locally

Install dependencies:

```bash
npm install
```

Start PostgreSQL with Docker:

```bash
docker compose up nestjs-demo-postgres
```

If the backend runs directly on your machine, update `.env` like this:

```env
DB_HOST=localhost
DB_PORT=5543
```

Then start the NestJS dev server:

```bash
npm run start:dev
```

On Windows PowerShell, if `npm` is blocked by execution policy, use:

```bash
npm.cmd run start:dev
```

## Useful Commands

```bash
npm run build
npm run test
npm run lint
```

Swagger is configured in the app. After starting the backend, check the configured Swagger route in `src/swagger.ts`.
