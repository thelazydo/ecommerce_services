# Task Planning: E-commerce Microservices

## Task Checklist
- [x] **Task 1: Project Setup & Docker Configuration**
  - Create the main project structure (directories for customer-service, product-service, order-service, payment-service).
  - Create a root `docker-compose.yml` defining MongoDB, RabbitMQ, and the 4 Node.js services.

- [x] **Task 2: Customer Service Implementation**
  - Initialize Node.js app (`customer-service/package.json`).
  - Configure Express and Mongoose.
  - Create Customer Model (`_id`, `name`, `email`).
  - Create `POST /customers/seed` endpoint to populate an initial customer.
  - Create `GET /customers/:id` endpoint.
  - Write tests for Customer endpoints using Jest and Supertest.

- [x] **Task 3: Product Service Implementation**
  - Initialize Node.js app (`product-service/package.json`).
  - Configure Express and Mongoose.
  - Create Product Model (`_id`, `name`, `price`, `description`).
  - Create `POST /products/seed` endpoint to populate initial products.
  - Create `GET /products/:id` endpoint.
  - Write tests for Product endpoints using Jest and Supertest.

- [x] **Task 4: Order Service Implementation**
  - Initialize Node.js app (`order-service/package.json`).
  - Configure Express and Mongoose.
  - Create Order Model (`_id`, `customerId`, `productId`, `amount`, `orderStatus`).
  - Create `POST /orders` endpoint.
  - Implement REST client logic (e.g., using Axios) to call `Payment Service` on order creation.
  - Write tests for Order endpoints, mocking the Axios requests to the Payment Service.

- [x] **Task 5: Payment Service Implementation**
  - Initialize Node.js app (`payment-service/package.json`).
  - Configure Express, Mongoose, and Amqplib.
  - Create Transaction Model (`_id`, `customerId`, `orderId`, `productId`, `amount`, `status`, `createdAt`).
  - Create `POST /payments` endpoint to receive payment request.
  - Implement RabbitMQ publisher inside the `/payments` handler.
  - Implement a RabbitMQ worker (consumer) to listen to `payment.processed` queue and save to the database.
  - Write tests for Payment endpoints, mocking the RabbitMQ amqplib calls.

- [x] **Task 6: Verification & Documentation**
  - Ensure all services start correctly with `docker-compose up`.
  - Document how to test and run the project (in README.md).
  - Update project `changes.md` with modified files.