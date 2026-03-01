# Product Service

Manages product entities — seeding and retrieval.

## Architecture

```
src/
  application/     # Use cases (SeedProduct, GetProduct)
  domain/          # Product entity, repository interface, errors
  infrastructure/  # MongoDB repository, web middleware
  main/            # Express app, routes, config, DI container
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3002` | HTTP server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (min 16 chars) |
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
| `POST` | `/api/v1/products/seed` | Bearer JWT | Seed a default product |
| `GET` | `/api/v1/products/:id` | Bearer JWT | Get product by ObjectId |
| `GET` | `/api-docs` | No | Swagger UI |
