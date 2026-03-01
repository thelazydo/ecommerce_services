# Task Planning: KYC & Security Hardening

## Task Checklist

- [ ] **Task 1: Secrets Management & Environment Configuration**
  - Create a root `.env.example` file documenting required variables (`MONGODB_URI`, `RABBITMQ_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`).
  - Update `docker-compose.yml` to use environment variable substitution instead of plaintext values.
  - Ensure `.env` is added to `.gitignore`.

- [ ] **Task 2: Database ACIDity & Replica Set Initialization**
  - Modify `docker-compose.yml` to start MongoDB with `--replSet rs0`.
  - Add an initialization step (script or container) to execute `rs.initiate()` on the MongoDB instance to establish the replica set.
  - Update Mongoose connection strings/options in all microservices (`server.ts`) to enforce strict write concerns (`w: 'majority'`, `j: true`).

- [ ] **Task 3: Zero Trust Network & Authentication Layer**
  - Install `jsonwebtoken` and `@types/jsonwebtoken` in all four services.
  - Implement an Express middleware (`requireAuth.ts`) to verify JWTs from the `Authorization: Bearer <token>` header against the `JWT_SECRET`.
  - Apply the authentication middleware to all functional endpoints (excluding `/health` and `/ready`).
  - Update the Order Service to forward the authenticated user's `Bearer` token in the Axios request sent to the Payment Service.

- [ ] **Task 4: Data Privacy & Field-Level Encryption (FLE)**
  - Create a cryptographic utility (`encryption.ts`) using Node's native `crypto` module (e.g., deterministic AES-256-CBC for searchable fields like email, AES-256-GCM for name).
  - Update the `Customer` Mongoose schema to use custom getters and setters that seamlessly encrypt and decrypt `name` and `email` before saving to and after reading from MongoDB.
  - Ensure the Customer seeding logic correctly handles the encrypted email lookup.

- [ ] **Task 5: Log Data Masking & PII Redaction**
  - Update the `pino` logger initialization in all services to configure the `redact` option.
  - Ensure paths like `req.headers.authorization`, `email`, `name`, `payload.email`, and `payload.name` are explicitly censored with `[REDACTED]`.

- [ ] **Task 6: Immutable Audit Logging**
  - Define an `IAuditLog` interface and `AuditLog` Mongoose model in the relevant services (Customer, Order, Payment).
  - Inject audit logging into the `POST /customers/seed` route (action: `CUSTOMER_SEEDED`).
  - Inject audit logging into the `POST /orders` route (action: `ORDER_CREATED`).
  - Inject audit logging into the Payment Service worker upon successful transaction save (action: `PAYMENT_PROCESSED`).
  - Ensure audit logs capture the `actorId` (from the JWT), `correlationId`, `entityId`, and `timestamp`.

- [ ] **Task 7: Tests Update & Verification**
  - Update all integration tests (`app.test.ts`) across the four services to dynamically generate and inject valid JWTs for authorized requests.
  - Add negative test cases for missing or invalid tokens (`401 Unauthorized`).
  - Add tests in Customer Service verifying that `name` and `email` are stored as encrypted ciphertexts in the raw database (bypassing Mongoose getters).
  - Add tests verifying that `AuditLog` entries are successfully created during critical actions.
  - Verify `docker-compose up --build` successfully brings up the hardened infrastructure, including the MongoDB Replica Set.