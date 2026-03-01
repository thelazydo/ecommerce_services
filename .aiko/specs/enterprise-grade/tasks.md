# Task Planning: Enterprise-Grade Enhancements

## Task Checklist

- [x] **Task 1: Core Utilities & Dependencies Initialization**
  - Install necessary enterprise packages (`winston` or `pino` for logging, `uuid` for correlation IDs, `joi` or `zod` for validation) across all four microservices (`customer-service`, `product-service`, `order-service`, `payment-service`).

- [x] **Task 2: Fail-Fast Configuration & Health Checks**
  - Update `server.js` in all services to strictly validate required environment variables at boot and `process.exit(1)` if missing.
  - Implement `/health` endpoint for liveness probes in all services.
  - Implement `/ready` endpoint for readiness probes in all services (verifying MongoDB and RabbitMQ connectivity).

- [x] **Task 3: Graceful Shutdown Implementation**
  - Add `process.on('SIGTERM')` and `process.on('SIGINT')` handlers to all services.
  - Ensure the Express HTTP server is closed gracefully (`server.close()`).
  - Ensure MongoDB connections are cleanly disconnected.
  - Ensure RabbitMQ channels and connections are safely closed (Payment Service).

- [x] **Task 4: Distributed Tracing & Structured Logging**
  - Implement a structured JSON logger (e.g., Winston) in all services.
  - Replace all existing `console.log` and `console.error` calls with the structured logger.
  - Implement an Express middleware in all services to extract or generate a unique `x-correlation-id` header.
  - Update the Order Service to forward the `x-correlation-id` header in its Axios REST call to the Payment Service.
  - Update the Payment Service to extract the correlation ID and include it in the RabbitMQ message payload, and ensure the background worker logs it.

- [x] **Task 5: Input Validation**
  - Create validation schemas (e.g., using Joi/Zod) for `POST /orders` (Order Service).
  - Create validation schemas for `POST /payments` (Payment Service).
  - Update the Express route handlers to validate `req.body` against the schemas and return standardized `400 Bad Request` errors if validation fails.

- [x] **Task 6: Idempotency & Dead Letter Queue (DLQ)**
  - Update `POST /payments` to check for existing transactions/processing using the `orderId` to ensure idempotency (prevent duplicate RabbitMQ publishes on retries).
  - Update RabbitMQ initialization in the Payment Service to assert a Dead Letter Exchange (`payment.dlx`) and Queue (`payment.dlq`).
  - Configure the main `payment.processed` queue to route rejected messages to `payment.dlx`.
  - Update the Payment Service worker to explicitly `nack` (negative acknowledge) messages without requeueing when a processing or database error occurs, so they route to the DLQ.

- [x] **Task 7: Tests Update & Verification**
  - Update existing unit and integration tests to pass the new validation rules.
  - Add test cases for invalid payloads (expecting HTTP 400).
  - Add test cases for idempotency (e.g., sending the same payment request twice should yield a 200 but only publish once).
  - Add test cases verifying health check endpoints (`/health`, `/ready`).
  - Ensure `docker-compose up --build` spins up the hardened infrastructure successfully.
  - Update `README.md` and `changes.md` to document the new enterprise-grade features.