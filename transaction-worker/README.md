# Transaction Worker

Standalone RabbitMQ consumer that listens on the `payment.processed` queue and persists transactions to MongoDB.

## Architecture

```
src/
  application/     # SaveTransactionUseCase
  domain/          # Transaction entity, repository interface
  infrastructure/  # MongoDB repository, Mongoose model
  main/            # Entry point, Zod config
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `RABBITMQ_URL` | **Yes** | — | RabbitMQ AMQP URL |
| `LOG_LEVEL` | No | `info` | Pino log level |

## Running Locally

To run this worker individually:
```bash
cp ../.env.example .env   # edit values
bun install
bun run dev
```
*(Alternatively, you can setup and start all services from the root using `make start` or `just start`)*

## Testing

To run tests for this worker:
```bash
bun test
```
*(Alternatively, you can test this worker from the root using `make test-worker` or `just test-worker`)*

## Asynchronous Processing (How It Works)

This worker acts as a standalone asynchronous RabbitMQ consumer.

1. Connects to MongoDB and RabbitMQ on startup.
2. Consumes payment transaction messages from the `payment.processed` queue.
3. Persists each processed message as a `Transaction` document in the core database.
4. On failure (e.g., database connection issues), the worker handles retries. After exhaustion, it routes the message to the Dead Letter Queue (`payment.dlq`) to ensure no data is lost.
5. Handles `SIGTERM`/`SIGINT` for graceful shutdown and channel closing.
