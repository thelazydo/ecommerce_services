# Payment Service

Processes payments with idempotency and publishes results to RabbitMQ.

## Architecture

```
src/
  application/     # Use cases (ProcessPayment)
  domain/          # Transaction entity, repository interface
  infrastructure/  # MongoDB repository, RabbitMQ publisher, web middleware
  main/            # Express app, routes, config, DI container
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3004` | HTTP server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `RABBITMQ_URL` | **Yes** | — | RabbitMQ AMQP URL |
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
*(Alternatively, you can test this service from the root using `make test-payment` or `just test-payment`)*

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness probe |
| `GET` | `/ready` | No | Readiness probe (MongoDB + RabbitMQ) |
| `POST` | `/api/v1/payments` | Bearer JWT | Process a payment |
| `GET` | `/api-docs` | No | Swagger UI |

### API Documentation (Swagger)

This service provides interactive REST API documentation using Swagger UI. Once the service is running, you can access the documentation at [http://localhost:3004/api-docs](http://localhost:3004/api-docs).

Use this interface to explore available endpoints, view request and response schemas, and execute API calls directly from your browser. Keep in mind that securing endpoints require providing a valid Bearer JWT token.

## Asynchronous Messaging (RabbitMQ)

The Payment Service relies on **RabbitMQ** for asynchronous communication regarding payment statuses.

- **Publishes**: Emits an event with the payment result data to the `payment.processed` exchange.
