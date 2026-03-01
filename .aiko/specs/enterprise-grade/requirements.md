# Requirements: Enterprise-Grade Enhancements

## Objective
Elevate the existing microservices architecture to an enterprise-grade standard suitable for a KYC/FinTech environment. The focus will be on security, distributed system resilience, observability, and maintainability, all while strictly adhering to the original system constraints (e.g., maintaining the synchronous REST call from Order to Payment).

## Functional Enhancements
1. **Input Validation**:
   - Strictly validate and sanitize incoming request payloads across all services using a validation library (e.g., Joi or Zod).
   - Reject invalid payloads with appropriate HTTP 400 responses and clear validation details.

2. **Idempotency**:
   - The Payment Service must implement idempotency to ensure that the same payment request (identified by `orderId` or a dedicated idempotency key) does not result in duplicate processing or duplicate RabbitMQ messages, mitigating the risk of double-charging if a network retry occurs.

3. **Dead Letter Queue (DLQ)**:
   - Configure a Dead Letter Exchange and Queue in RabbitMQ.
   - If the Payment Service background worker fails to process a message (e.g., DB error or validation failure), the message should be routed to the DLQ instead of being silently dropped or stuck in an infinite loop.

## Non-Functional Enhancements (Observability & Architecture)
1. **Correlation IDs & Distributed Tracing**:
   - Generate a unique `x-correlation-id` (UUID) at the entry point (e.g., Order Service creation).
   - Propagate the `x-correlation-id` through the synchronous REST call headers to the Payment Service.
   - Include the `x-correlation-id` in the payload published to the RabbitMQ `payment.processed` queue.
   - Include the `x-correlation-id` in all log entries for end-to-end trace tracking across multiple microservices.

2. **Structured Logging**:
   - Replace standard `console.log` and `console.error` with a structured JSON logger (e.g., Winston or Pino).
   - Ensure logs include timestamps, log levels, service names, and correlation IDs to facilitate central log aggregation.

3. **Health Checks**:
   - Implement `/health` and `/ready` endpoints in all Express services to facilitate proper Docker/orchestration monitoring and readiness probing.

4. **Graceful Shutdown**:
   - Implement listeners for `SIGTERM` and `SIGINT` signals in all services.
   - Gracefully stop accepting new HTTP requests, close Express server instances, safely close MongoDB connections, and gracefully close RabbitMQ channels/connections before exiting the Node process.

5. **Strict Environment Configuration (Fail-Fast)**:
   - Implement "fail-fast" behavior for missing critical environment variables instead of relying solely on local fallbacks. The service should crash immediately at boot if essential configurations (e.g., `MONGODB_URI`, `RABBITMQ_URL`) are entirely missing or invalid.

## Constraints to Maintain
- **Core Flow**: The Order Service MUST still communicate synchronously with the Payment Service via REST, and the Payment Service MUST still publish asynchronous transaction details to RabbitMQ.
- **Data Stores**: We will continue using MongoDB and RabbitMQ.
- **Tech Stack**: Node.js and Express.js constraints remain intact.