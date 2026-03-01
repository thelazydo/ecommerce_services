# Requirements: KYC & Security Hardening

## Objective
Harden the existing e-commerce microservices architecture to meet enterprise KYC (Know Your Customer) and FinTech compliance standards. This phase focuses on data privacy, secure secrets management, strict database ACIDity, auditability, and introducing a zero-trust network perimeter.

## Functional Enhancements

### 1. Secrets Management
- Remove plaintext configurations (`MONGODB_URI`, `RABBITMQ_URL`, etc.) from the `docker-compose.yml`.
- Implement a `.env` file based configuration injection for Docker Compose to securely manage secrets without requiring external services like AWS KMS or HashiCorp Vault.

### 2. Database ACIDity & Immutable Audit Logs
- **Replica Set**: Configure the containerized MongoDB instance to run as a Replica Set to enable full ACID transaction support.
- **Write Concerns**: Enforce strict write concerns (`w: "majority"`) on all database operations to ensure data durability.
- **Audit Logging**: Implement an immutable `AuditLog` collection. Critical actions (e.g., Order Creation, Payment Processing, Customer Data Access/Modification) must write a record to this collection detailing *who* performed the action, *what* was altered, the *timestamp*, and the *correlationId*.

### 3. Data Privacy & PII Protection (Field-Level Encryption)
- **Encryption at Rest**: Implement Field-Level Encryption (FLE) in the application layer. Sensitive fields in the Customer Service (e.g., `name`, `email`) must be encrypted using a strong symmetric encryption algorithm (like AES-256-GCM) before being saved to MongoDB. The encryption key should be injected via the `.env` file.
- **Data Masking in Logs**: Configure the `pino` logger across all microservices to automatically redact/mask sensitive fields (e.g., `email`, `name`, `authorization` headers) to prevent PII from leaking into standard application logs.

### 4. Zero Trust & Network Security (Authentication Layer)
- **JWT Authentication**: Add a layer of authentication to the microservices.
- Implement an Express middleware that expects and validates a JSON Web Token (JWT) in the `Authorization` header (`Bearer <token>`).
- Define a secret key in the `.env` file to verify the token signature.
- Reject unauthenticated requests with a `401 Unauthorized` status.

## Constraints to Maintain
- **No External Paid Accounts**: FLE and secrets management must be handled locally using standard cryptographic libraries and `.env` files. We will not use external KMS providers.
- **Core Architecture**: The core asynchronous and synchronous flows between the 4 microservices must remain intact, but now heavily secured.