# Design: Enterprise-Grade Enhancements

## Architecture Overview
The system retains its core 4-microservice architecture (Customer, Product, Order, Payment), maintaining the synchronous REST flow between Order and Payment, and asynchronous message queueing via RabbitMQ for transactions. The enhancements focus on applying enterprise-grade resilience, observability, and data integrity patterns.

## 1. Input Validation
**Library**: `joi` (or `zod`)
**Implementation**:
- Introduce a validation middleware for all `POST` endpoints.
- **Order Service (`POST /orders`)**: Strictly validate `customerId` (UUID/MongoID string), `productId` (UUID/MongoID string), and `amount` (positive number).
- **Payment Service (`POST /payments`)**: Strictly validate `customerId`, `orderId`, `productId`, and `amount`.
- Invalid requests will immediately terminate with an HTTP `400 Bad Request` and a standardized JSON error response containing the exact validation failures.

## 2. Idempotency (Payment Service)
To prevent duplicate charges or duplicate RabbitMQ messages during network retries:
- The `Payment Service` will use `orderId` as the idempotency key.
- **Flow**:
  1. Receive `POST /payments`.
  2. Query the `Transaction` collection (or an idempotency tracking collection) for the given `orderId`.
  3. If a transaction already exists for this `orderId`, return `200 OK` (Idempotent response) and **do not** publish a new message to RabbitMQ.
  4. If it does not exist, publish to RabbitMQ and return `200 OK`.
- *Note: In a fully distributed Saga, we would track idempotency keys in Redis or a dedicated table. Here, checking for existing processing logic prevents the dual-write/retry issue.*

## 3. RabbitMQ Dead Letter Queue (DLQ)
To ensure failed background jobs are not lost or infinitely retried:
- **Topology Update**:
  - Exchange: `payment.dlx` (Direct Exchange)
  - Queue: `payment.dlq` (Bound to `payment.dlx`)
  - Main Queue: `payment.processed` configured with `deadLetterExchange: 'payment.dlx'`.
- **Worker Logic**:
  - If the worker encounters an error (e.g., MongoDB constraint failure, validation error), it will `nack` (negative acknowledge) the message with `requeue: false`.
  - RabbitMQ will automatically route the rejected message to `payment.dlq` for future manual inspection or automated alerts.

## 4. Distributed Tracing & Correlation IDs
**Implementation**:
- **Entry Point (Order Service)**: 
  - Middleware checks for `x-correlation-id` in the request header. If missing, it generates a new UUID (`uuidv4`).
- **Synchronous Propagation**: 
  - Order Service includes the `x-correlation-id` in the Axios request headers sent to Payment Service.
- **Asynchronous Propagation**: 
  - Payment Service extracts the `x-correlation-id` from the Axios header and injects it into the RabbitMQ message payload: `{ correlationId, customerId, orderId, ... }`.
- **Worker Propagation**: 
  - The background worker extracts the `correlationId` from the message and includes it in its local logs.

## 5. Structured Logging
**Library**: `winston` or `pino`
**Implementation**:
- Replace `console.log` and `console.error` with a configured JSON logger.
- Log format will include standard fields: `timestamp`, `level`, `service`, `message`, and `correlationId`.
- **Example Log**: 
  `{"level":"info","service":"payment-service","correlationId":"abc-123","message":"Payment processed and published","orderId":"ord-456","timestamp":"2023-10-27T10:00:00Z"}`

## 6. Health Checks & Readiness Probes
**Endpoints**:
- `GET /health`: Returns `200 OK` indicating the Express server is up (Liveness).
- `GET /ready`: Evaluates dependencies (Readiness).
  - Checks `mongoose.connection.readyState === 1`.
  - For Payment Service, also checks if the RabbitMQ channel is open.
  - Returns `200 OK` if all dependencies are connected, otherwise `503 Service Unavailable`.

## 7. Graceful Shutdown & Fail-Fast Configuration
**Fail-Fast**:
- A configuration validation step at the top of `server.js`.
- Checks for required environment variables (`MONGODB_URI`, `PORT`, `RABBITMQ_URL` for Payment, `PAYMENT_SERVICE_URL` for Order).
- If missing, logs a critical error and calls `process.exit(1)`.

**Graceful Shutdown**:
- Listeners for `process.on('SIGTERM')` and `process.on('SIGINT')`.
- Sequence:
  1. Stop accepting new HTTP requests (`server.close()`).
  2. Close RabbitMQ channel and connection (`amqp.close()`).
  3. Disconnect from MongoDB (`mongoose.disconnect()`).
  4. Exit process (`process.exit(0)`).