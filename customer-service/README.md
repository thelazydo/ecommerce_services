# Customer Service

Manages customer entities — seeding and retrieval.

## Architecture

```
src/
  application/     # Use cases (SeedCustomer, GetCustomer)
  domain/          # Customer entity, repository interface, errors
  infrastructure/  # MongoDB repository, web middleware
  main/            # Express app, routes, config, DI container
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | HTTP server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (min 16 chars) |
| `ENCRYPTION_KEY` | **Yes** | — | AES encryption key for PII |
| `LOG_LEVEL` | No | `info` | Pino log level |

## Running Locally

```bash
cp ../.env.example .env   # edit values
bun install
bun run dev
```

## Testing

```bash
bun test
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness probe |
| `GET` | `/ready` | No | Readiness probe (MongoDB) |
| `POST` | `/api/v1/customers/seed` | Bearer JWT | Seed a default customer |
| `GET` | `/api/v1/customers/:id` | Bearer JWT | Get customer by ObjectId |
| `GET` | `/api-docs` | No | Swagger UI |
