# Design: E-commerce Microservices

## Architecture Overview
The application consists of four microservices, each fulfilling a specific domain. The architecture adheres to a clean microservices approach with Express.js.
All services run inside Docker containers managed by Docker Compose. RabbitMQ and MongoDB instances will also be containerized.

### Microservices
1. **Customer Service (Port 3001)**
   - Manages customer profiles and seeding.
   - Database: MongoDB (`ecommerce-db`), Collection `customers`.

2. **Product Service (Port 3002)**
   - Manages product inventory and seeding.
   - Database: MongoDB (`ecommerce-db`), Collection `products`.

3. **Order Service (Port 3003)**
   - Entry point for creating an order.
   - Coordinates with Payment Service via REST.
   - Database: MongoDB (`ecommerce-db`), Collection `orders`.

4. **Payment Service (Port 3004)**
   - Receives payment request via REST from Order Service.
   - Publishes transaction to RabbitMQ.
   - Includes a background worker consuming from RabbitMQ to save transactions.
   - Database: MongoDB (`ecommerce-db`), Collection `transactions`.

## System Flow (Happy Path)
1. **POST** `/orders` is hit on the **Order Service** with `{ customerId, productId, amount }`.
2. **Order Service** sends a synchronous REST **POST** to **Payment Service** (`/payments`) with `{ customerId, orderId, productId, amount }`.
3. **Payment Service** successfully acknowledges the request.
4. **Order Service** creates the order in the DB with status `pending`.
5. **Order Service** returns `{ customerId, orderId, productId, orderStatus }` to the client.
6. **Payment Service** asynchronously publishes an event `payment.processed` to RabbitMQ with the transaction payload.
7. **Worker** (running inside Payment Service container) consumes the event and inserts the transaction record into the MongoDB `transactions` collection.

## Technology Stack
- **Node.js + Express.js**: For all microservices.
- **MongoDB + Mongoose**: For data persistence.
- **RabbitMQ**: For message broker.
- **Axios**: For HTTP REST service-to-service communication.
- **Amqplib**: For interacting with RabbitMQ.
- **Jest + Supertest**: For automated testing.
- **Docker + Docker Compose**: For local deployment and orchestration.

## Database Schema (MongoDB Mongoose)
- **Customer**: `_id`, `name`, `email`
- **Product**: `_id`, `name`, `price`, `description`
- **Order**: `_id`, `customerId`, `productId`, `amount`, `orderStatus` (Enum: `pending`)
- **Transaction**: `_id`, `customerId`, `orderId`, `productId`, `amount`, `status` (e.g., `success`), `createdAt`

## API Design
### Customer Service
- `GET /customers/:id`: Retrieve customer
- `POST /customers/seed`: Seed initial customer

### Product Service
- `GET /products/:id`: Retrieve product
- `POST /products/seed`: Seed initial products

### Order Service
- `POST /orders`: Create a new order

### Payment Service
- `POST /payments`: Initiate payment process

## Directory Structure
Each service will be isolated with its own package.json.
```text
/
  docker-compose.yml
  customer-service/
  product-service/
  order-service/
  payment-service/
```

## Testing Strategy
- Unit tests for handlers and models.
- Integration tests for endpoints using Supertest.
- Mocking RabbitMQ publisher for Payment Service tests.
- Mocking REST calls using Jest mocks for Order Service tests.
