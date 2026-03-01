# Changes and Implementations: E-commerce Microservices

## Project Setup & Docker Configuration
- Created `docker-compose.yml` defining `mongodb`, `rabbitmq`, and 4 microservices (`customer-service`, `product-service`, `order-service`, `payment-service`).
- Configured network dependencies and environment variables in the Compose file.

## Services Implementations

### Customer Service (`customer-service`)
- Set up Express.js and Mongoose.
- Implemented `Customer` model with `name` and `email` properties.
- Created `POST /customers/seed` endpoint for initial customer data population.
- Implemented startup logic to automatically seed customer on database connection.
- Created `GET /customers/:id` endpoint.
- Handled error states appropriately.
- Created Unit/Integration tests with Jest, Supertest, and `mongodb-memory-server`.

### Product Service (`product-service`)
- Set up Express.js and Mongoose.
- Implemented `Product` model with `name`, `price`, and `description` properties.
- Created `POST /products/seed` endpoint to seed product.
- Implemented startup logic to automatically seed product on database connection.
- Created `GET /products/:id` endpoint.
- Handled error states appropriately.
- Created Unit/Integration tests with Jest, Supertest, and `mongodb-memory-server`.

### Order Service (`order-service`)
- Set up Express.js and Mongoose.
- Implemented `Order` model with `customerId`, `productId`, `amount`, and `orderStatus` properties.
- Created `POST /orders` endpoint that receives order data, initiates an HTTP POST to Payment Service using `axios`, and if successful, saves the order with `orderStatus: 'pending'`.
- Created Unit/Integration tests with Jest, Supertest, `nock` (to mock Payment Service API calls), and `mongodb-memory-server`.

### Payment Service (`payment-service`)
- Set up Express.js, Mongoose, and `amqplib` for RabbitMQ interaction.
- Implemented `Transaction` model with `customerId`, `orderId`, `productId`, `amount`, `status`, and `createdAt` properties.
- Created `POST /payments` endpoint that acts as a mock payment processor and publishes the payment details to a RabbitMQ queue (`payment.processed`).
- Created a background worker (consumer) that listens to the `payment.processed` queue. When a message is received, it saves the transaction data to the database and acknowledges the message.
- Created Unit/Integration tests using Jest, Supertest, mocked `amqplib` channels, and `mongodb-memory-server`.
- Replaced connection variables and logic to incorporate connection retries for both MongoDB and RabbitMQ, which makes the services resilient when starting inside Docker where the database or message broker might take a few seconds to initialize.

## Documentation
- Created `README.md` at the root directory documenting the architecture, prerequisites, setup instructions using Docker Compose, how to fetch the seeded data IDs, how to create an order, the system's asynchronous workflow, and instructions to run local unit tests.

## Other Configuration
- Created root `.gitignore`.
- Set up separate `Dockerfile` for each microservice using multi-stage builds.
- Set up package.jsons and test commands in each microservice.

## Enterprise-Grade Enhancements
- **Input Validation**: Added strict validation using `zod` in Order and Payment services.
- **Idempotency**: Implemented idempotency checks using `orderId` in the Payment service to prevent duplicate processing.
- **Dead Letter Queue (DLQ)**: Configured RabbitMQ Dead Letter Exchange (`payment.dlx`) and Queue (`payment.dlq`) for failed payment messages.
- **Observability**: Implemented correlation IDs via `x-correlation-id` and distributed tracing headers across Axios requests and RabbitMQ messages. Added structured JSON logging using `pino` and `pino-http`.
- **Health Checks**: Added `/health` and `/ready` endpoints to all services.
- **Graceful Shutdown**: Handled `SIGINT` and `SIGTERM` signals in all services to close HTTP servers, MongoDB connections, and RabbitMQ channels cleanly.
- **Fail-Fast**: Configured startup checks for critical environment variables in all services.
- **Resilience**: Solved Dual Write problem in Order service by persisting orders as `pending` before charging, and updating to `failed` upon error.

## TypeScript Migration
- Transitioned all four microservices from CommonJS JavaScript to TypeScript (ES Modules).
- Established a strictly typed codebase using interfaces for Mongoose Models, Express requests, and RabbitMQ message payloads.
- Upgraded Jest to `ts-jest` for running TypeScript tests natively.
- Adjusted Dockerfiles to perform multi-stage builds (compile `.ts` into `.js` in the `dist` folder during the builder phase).
- Added new build scripts (`bun run build`, `bun run start`) handling the compiled TypeScript code cleanly.

## KYC & Security Hardening
- **Secrets Management**: Removed plaintext secrets from `docker-compose.yml` and implemented `.env` file configuration injection.
- **Database ACIDity**: Configured MongoDB as a Replica Set (`rs0`) and enforced strict write concerns (`w: "majority"`, `j: true`) for data durability.
- **Zero Trust Network**: Implemented JWT Authentication middleware (`requireAuth`) across all microservices to verify internal request authorization.
- **Field-Level Encryption (FLE)**: Implemented AES-256-GCM encryption for sensitive Customer data (`name`) and deterministic encryption for searchable fields (`email`) at rest.
- **Log Data Masking**: Configured `pino` to redact sensitive PII (Authorization headers, names, emails) from application logs.
- **Immutable Audit Logging**: Implemented an `AuditLog` collection and utility to record critical actions (`CUSTOMER_SEEDED`, `ORDER_CREATED`, `PAYMENT_PROCESSED`) with actor and correlation tracking.
