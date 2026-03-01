# Design: TypeScript Migration

## Architecture Overview
The core architecture remains completely identical: a 4-microservice Node.js system (Customer, Product, Order, Payment) communicating via synchronous REST APIs and asynchronous RabbitMQ events, backed by MongoDB. 
The fundamental shift occurs internally within each service, swapping plain JavaScript (CommonJS) for TypeScript (ES Modules) to enable static typing, compile-time validation, and improved developer tooling.

## 1. Directory Structure & Build Process
Each microservice will adopt a standardized TypeScript directory layout:
```text
service-name/
  src/
    app.ts       # Express app initialization, routing, middlewares
    server.ts    # Entry point, DB connection, graceful shutdown
    models/      # Mongoose Schema definitions & TypeScript interfaces
    types/       # Shared TypeScript types (e.g., Express Request extensions)
    __tests__/   # Jest tests using ts-jest
  dist/          # Compiled JavaScript output (ignored in git)
  tsconfig.json  # TypeScript compiler options
  package.json   # Updated scripts (build, start, dev)
```

## 2. TypeScript Configuration (`tsconfig.json`)
The foundation of the migration will rely on a strict `tsconfig.json` for all four services:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts", "src/__tests__"]
}
```

## 3. Core Typings & Interfaces

### 3.1. Express Request Extension
To support the custom `x-correlation-id` and Pino logger injected via middleware, the global Express `Request` interface must be extended:
```typescript
// src/types/express.d.ts
import { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      log: Logger;
    }
  }
}
```

### 3.2. Mongoose Models
All Mongoose schemas will be strongly typed using generic `Document` interfaces.
**Example (Order Service):**
```typescript
import { Document, Schema, model } from 'mongoose';

export interface IOrder extends Document {
  customerId: string;
  productId: string;
  amount: number;
  orderStatus: 'pending' | 'failed' | 'completed';
}

const orderSchema = new Schema<IOrder>({
  customerId: { type: String, required: true },
  productId: { type: String, required: true },
  amount: { type: Number, required: true },
  orderStatus: { type: String, enum: ['pending', 'failed', 'completed'], default: 'pending' },
});

export const Order = model<IOrder>('Order', orderSchema);
```

### 3.3. RabbitMQ Message Payload
The Payment Service worker will explicitly type the incoming message payload:
```typescript
export interface PaymentMessagePayload {
  customerId: string;
  orderId: string;
  productId: string;
  amount: number;
  correlationId: string;
}
```

## 4. Testing Configuration (`ts-jest`)
Jest must be configured to compile TypeScript files on the fly.
1. Install `ts-jest` and `@types/jest`.
2. Update `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
};
```

## 5. Dockerization Strategy (Multi-stage Build)
To optimize image size and security, the `Dockerfile` will be updated to a multi-stage process:
1. **Builder Stage**: Install all dependencies (including `devDependencies` like TypeScript), copy source code, and run `npm run build` (`tsc`).
2. **Production Stage**: Use a fresh Node Alpine image, copy only `package.json` and the compiled `dist/` folder from the builder stage, install only `--production` dependencies, and execute `node dist/server.js`.

**Example Dockerfile**:
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

## 6. Migration Execution Plan
1. **Setup**: Initialize `tsconfig.json` and install necessary `@types/*` in all four services.
2. **Refactor**: Rename files from `.js` to `.ts`, update imports/exports, define interfaces, and resolve compiler errors.
3. **Test Setup**: Configure `ts-jest` and resolve test typings (e.g., mocking `amqplib` with proper types).
4. **Build Pipeline**: Create multi-stage Dockerfiles and update `docker-compose.yml` to target the new build process.
5. **Validation**: Execute full end-to-end tests and unit tests to ensure behavior matches the original JavaScript implementation perfectly.