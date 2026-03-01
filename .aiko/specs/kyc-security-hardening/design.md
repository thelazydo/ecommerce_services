# Design: KYC & Security Hardening

## Architecture Overview
This phase introduces security controls strictly targeted at mitigating FinTech and KYC risks. We are moving from a loosely connected microservices setup to a highly controlled, zero-trust, audited architecture without introducing paid external services.

## 1. Secrets Management (`.env`)
Instead of hardcoding connection strings in `docker-compose.yml`, we will use an external `.env` file that is inherently ignored by source control (`.gitignore`).
- `docker-compose.yml` will read values using variable substitution (e.g., `${MONGODB_URI}`).
- **Required Secrets**: `MONGODB_URI`, `RABBITMQ_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`.
- We will include a `.env.example` file to outline the expected structure.

## 2. Zero Trust Network Security (JWT Authentication)
- **Library**: `jsonwebtoken`
- **Implementation**: A shared middleware function `verifyToken` placed in all microservices.
- **Flow**:
  1. Extract the `Authorization` header (`Bearer <token>`).
  2. Verify the token signature against `process.env.JWT_SECRET`.
  3. Attach the decoded payload (e.g., `userId`, `role`) to the `Express.Request` object.
  4. Reject missing or invalid tokens with HTTP `401 Unauthorized`.
- *Note: As there is no dedicated Auth Service in this scope, testing will involve signing a static JWT using the shared secret and passing it in the test headers.*

## 3. Data Privacy & PII (Field-Level Encryption)
- **Encryption Algorithm**: AES-256-GCM (provides both confidentiality and authenticity).
- **Target Fields**: `Customer.name`, `Customer.email`.
- **Implementation**:
  - We will create an `encryption.ts` utility using Node's native `crypto` module.
  - Mongoose `set` and `get` schema modifiers will automatically encrypt data on write, and decrypt data on read.
  - The symmetric `ENCRYPTION_KEY` (32 bytes) will be loaded from the `.env` file.
  - *Constraint*: Due to encryption, exact matches (like `Customer.findOne({ email })`) will require either deterministic encryption (AES-256-CBC) or storing a blind index (a salted hash of the email). We will use deterministic encryption for the `email` field to allow querying during the seed phase, while using GCM for other fields.

## 4. Log Data Masking
- **Library**: `pino` (native redaction).
- **Implementation**: Update the `pino` initialization in `app.ts` across all services:
  ```typescript
  const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    redact: {
      paths: ['req.headers.authorization', 'email', 'name', 'payload.email', 'payload.name'],
      censor: '[REDACTED]'
    }
  });
  ```

## 5. Database ACIDity & Write Concerns
- **Replica Set Configuration**:
  - Update `docker-compose.yml` to initiate the MongoDB container as a Replica Set (`--replSet rs0`).
  - Use an initialization script (or container) to run `rs.initiate()` on the Mongo node.
  - Update the `MONGODB_URI` to include `?replicaSet=rs0`.
- **Write Concerns**:
  - Update Mongoose connection options in all services to strictly enforce durability:
    ```typescript
    mongoose.connect(MONGODB_URI, { w: 'majority', j: true });
    ```

## 6. Immutable Audit Logging
- **New Collection**: `AuditLog` in the `ecommerce-db`.
- **Schema**:
  - `action`: String (e.g., `'ORDER_CREATED'`, `'PAYMENT_PROCESSED'`, `'CUSTOMER_SEEDED'`)
  - `entityId`: String (ID of the affected document)
  - `entityType`: String (`'Order'`, `'Transaction'`, `'Customer'`)
  - `actorId`: String (The `userId` extracted from the JWT)
  - `correlationId`: String
  - `timestamp`: Date
  - `metadata`: JSON (Additional context, strictly ensuring no PII is included)
- **Implementation**:
  - Create a shared `AuditLogger` utility/model.
  - Inject audit log writes into the critical paths of the `Customer`, `Order`, and `Payment` services immediately after successful database transactions.