# Requirements: TypeScript Migration

## Objective
Migrate the existing Node.js microservices (Customer, Product, Order, Payment) from plain JavaScript to TypeScript. This migration aims to introduce static type checking, enhance developer experience, reduce runtime errors, and enforce structured data contracts across the distributed system.

## Functional Enhancements
1. **Type Definitions**:
   - Define strict TypeScript interfaces and types for all internal data structures.
   - Type all Mongoose schemas and documents.
   - Strongly type incoming HTTP request bodies, queries, and parameters.
   - Strongly type RabbitMQ message payloads (including correlation IDs and transaction data).

2. **Refactoring**:
   - Convert all existing `.js` source files to `.ts` files.
   - Replace CommonJS `require()` and `module.exports` with ES Modules syntax (`import` / `export`) consistent with TypeScript standards.

3. **External Dependencies**:
   - Install and configure necessary DefinitelyTyped (`@types/*`) packages for all third-party libraries (Express, Mongoose, Amqplib, Axios, Pino, Uuid, Jest, Supertest).

## Non-Functional Enhancements (Tooling & Build)
1. **TypeScript Configuration**:
   - Add a `tsconfig.json` to each service.
   - Enable strict mode (`"strict": true`) to ensure high-quality type checking (e.g., no implicit `any`, strict null checks).

2. **Build Pipeline**:
   - Update `package.json` scripts to include `build` (compiling `.ts` to `.js` into a `dist/` directory) and `start` (running the compiled output).
   - Use `ts-node` or `ts-node-dev` for local development.

3. **Testing**:
   - Migrate Jest configurations to support TypeScript using `ts-jest`.
   - Ensure all unit and integration tests are properly typed and pass under the new TypeScript compilation phase.

4. **Dockerization**:
   - Update `Dockerfile` for each service to support a multi-stage build or compile TypeScript into JavaScript during the image build process before execution.
   - Ensure `docker-compose up` behaves transparently as it did before the migration.

## Constraints to Maintain
- **Core Business Logic**: The logical flow (REST communication, RabbitMQ DLQ, Idempotency, Correlation IDs, Error handling, Health checks) must remain absolutely identical to the enterprise-grade implementation.
- **Data Persistence**: Mongoose schemas must map precisely to existing MongoDB collections without data loss or structure alteration.