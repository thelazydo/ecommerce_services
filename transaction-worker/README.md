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

```bash
cp ../.env.example .env   # edit values
bun install
bun run dev
```

## How It Works

1. Connects to MongoDB and RabbitMQ
2. Consumes messages from `payment.processed` queue
3. Persists each message as a `Transaction` document
4. On failure, routes message to the Dead Letter Queue (`payment.dlq`)
5. Handles `SIGTERM`/`SIGINT` for graceful shutdown
