# Task Planning: TypeScript Migration

## Task Checklist

- [x] **Task 1: Project Restructuring & Dependencies**
  - For all four microservices (`customer-service`, `product-service`, `order-service`, `payment-service`):
    - Create a `src/` directory.
    - Move `app.js`, `server.js`, and `app.test.js` into `src/` and rename them to `.ts`.
    - Install TypeScript and type definitions: `typescript`, `ts-node`, `ts-jest`, `@types/node`, `@types/express`, `@types/jest`, `@types/supertest`, `@types/amqplib`, `@types/uuid`.
    - Initialize a strict `tsconfig.json`.

- [x] **Task 2: Customer Service Migration**
  - Define `ICustomer` interface extending `mongoose.Document`.
  - Type the Express `req`, `res`, and `next` parameters.
  - Extend the global Express Request interface to include `correlationId` and `log` (Pino Logger).
  - Update imports/exports to ES Module syntax.
  - Migrate `app.test.ts` to use strong types for Supertest responses and Mongoose documents.

- [x] **Task 3: Product Service Migration**
  - Define `IProduct` interface extending `mongoose.Document`.
  - Type the Express `req`, `res`, and `next` parameters.
  - Extend the global Express Request interface.
  - Update imports/exports to ES Module syntax.
  - Migrate `app.test.ts` to use strong types.

- [x] **Task 4: Order Service Migration**
  - Define `IOrder` interface extending `mongoose.Document`.
  - Type the Axios request/response generic types.
  - Type the Zod validation output (`validationResult.data`).
  - Update imports/exports to ES Module syntax.
  - Migrate `app.test.ts` to use strong types, ensuring `nock` intercepts are properly typed.

- [x] **Task 5: Payment Service Migration**
  - Define `ITransaction` interface extending `mongoose.Document`.
  - Define an interface for the incoming RabbitMQ message payload (`PaymentMessagePayload`).
  - Type the `amqplib` Channel and Connection objects.
  - Update the background worker to strictly type the parsed message content.
  - Update imports/exports to ES Module syntax.
  - Migrate `app.test.ts` to use strong types, properly typing the mocked `amqplib` instances.

- [x] **Task 6: Build Pipeline & Testing**
  - Create `jest.config.js` in all services configured for `ts-jest`.
  - Update `package.json` scripts:
    - `"build": "tsc"`
    - `"start": "node dist/server.js"`
    - `"dev": "ts-node src/server.ts"`
    - `"test": "jest"`
  - Verify all unit and integration tests pass successfully (`npm test`).

- [x] **Task 7: Dockerization & Verification**
  - Rewrite `Dockerfile` in all services to use a multi-stage build (compiling TypeScript in the `builder` stage, running the compiled `dist/` in the production stage).
  - Run `docker-compose up --build` and verify the entire system boots successfully.
  - Verify endpoints and message queues function as expected using manual curl requests or Postman.
  - Update `README.md` and `changes.md` with the TypeScript migration details.