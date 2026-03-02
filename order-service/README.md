# Order Service

Creates orders and coordinates with the payment-service via HTTP. Includes retry with exponential backoff and a circuit breaker pattern.

## Architecture

```
src/
  application/     # Use cases (CreateOrder), interfaces (IPaymentService)
  domain/          # Order entity, repository interface, errors
  infrastructure/  # MongoDB repository, HttpPaymentService (retry + circuit breaker)
  main/            # Express app, routes, config, DI container
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3003` | HTTP server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `PAYMENT_SERVICE_URL` | **Yes** | — | Payment service base URL |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (min 16 chars) |
| `LOG_LEVEL` | No | `info` | Pino log level |

## Running Locally

To run this service individually:
```bash
cp ../.env.example .env   # edit values
bun install
bun run dev
```
*(Alternatively, you can setup and start all services from the root using `make start` or `just start`)*

## Testing

To run tests for this service:
```bash
bun test
```
*(Alternatively, you can test this service from the root using `make test-order` or `just test-order`)*

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness probe |
| `GET` | `/ready` | No | Readiness probe (MongoDB + payment-service) |
| `POST` | `/api/v1/orders` | Bearer JWT | Create a new order |
| `GET` | `/api-docs` | No | Swagger UI |

## Resilience

- **Retry**: Exponential backoff (configurable `maxRetries`, `baseDelayMs`)
- **Circuit Breaker**: CLOSED → OPEN (after `failureThreshold` consecutive 5xx) → HALF_OPEN (after `resetTimeoutMs`)
