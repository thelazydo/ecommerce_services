# Requirements: E-commerce Microservices

## Objective
Migrate API-driven architecture to microservices to ensure seamless communication between customer, product, order, and payment services.

## Functional Requirements
1. **Services to Create**:
   - Customer Service
   - Product Service
   - Order Service
   - Payment Service

2. **Core Flow**:
   - A customer creates an order for a single product.
   - A REST request (containing `customerId`, `productId`, `amount`) is sent to the **Order Service**.
   - The **Order Service** sends a REST request (containing `customerId`, `orderId`, `amount`) to the **Payment Service**.
   - The **Order Service** saves the order to the database (containing `customerId`, `productId`, `orderId`, `amount`, and `orderStatus` initially `pending`).
   - The **Order Service** sends a response back to the customer (containing `customerId`, `orderId`, `productId`, and `orderStatus`).
   - The **Payment Service** publishes transaction details (`customerId`, `orderId`, `productId`, `amount`) to a **RabbitMQ** queue.
   - A worker consuming the RabbitMQ queue saves the transaction data into the database's transaction history.

3. **Data Initialization (Seeding)**:
   - Seed a single customer/user in the database.
   - Seed initial product data in the database.

4. **Assumptions**:
   - The customer is ordering exactly one product per request.

## Technical Constraints
- **Backend Technology**: Node.js and Express.js
- **Database**: MongoDB
- **Asynchronous Communication**: RabbitMQ for service-to-service messaging (Payment Service to DB worker)
- **Synchronous Communication**: REST APIs
- **Containerization**: Docker and Docker Compose for local build and testing
- **Testing**: Code should be properly tested (e.g., using Jest/Supertest)
- **Documentation**: Code should be properly documented
- **Mock Implementation**: Payment service logic is for demonstration only (no real payment processing).
