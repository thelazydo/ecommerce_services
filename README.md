# E-commerce Microservices

This project is a demonstration of a microservices architecture for an e-commerce platform. It involves four main services: Customer Service, Product Service, Order Service, and Payment Service. They communicate using both REST APIs and asynchronous messaging via RabbitMQ.

## Architecture

*   **Customer Service (Port 3001)**: Manages customer data.
*   **Product Service (Port 3002)**: Manages product data.
*   **Order Service (Port 3003)**: Handles order creation. Communicates synchronously with the Payment Service.
*   **Payment Service (Port 3004)**: Processes payments and publishes transaction details asynchronously to a RabbitMQ queue. It also contains a worker to consume those messages and save them to the database.

## Prerequisites

*   Docker and Docker Compose
*   Bun

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone git@github.com:thelazydo/ecommerce_services.git
    cd ecommerce_services
    ```

2.  **Start the services using Docker Compose:**
    ```bash
    docker-compose --env-file .env up --build
    ```
    This will start MongoDB, RabbitMQ, and all four Node.js microservices. Wait for all services to show successful connection messages in the terminal logs.

3.  **Get Seeded Data IDs:**
    A customer and a product are automatically seeded on startup. You can call the seed endpoints to retrieve their details and IDs:
    *   **Get Customer ID:**
        ```bash
        curl -X POST http://localhost:3001/customers/seed
        ```
        *Note the `_id` returned in the response for the `customerId`.*

    *   **Get Product ID:**
        ```bash
        curl -X POST http://localhost:3002/products/seed
        ```
        *Note the `_id` returned in the response for the `productId`.*

4.  **Create an Order:**
    Use the `customerId` and `productId` obtained from the previous steps.
    ```bash
    curl -X POST http://localhost:3003/orders \
    -H "Content-Type: application/json" \
    -d '{
      "customerId": "<your_customer_id>",
      "productId": "<your_product_id>",
      "amount": 99.99
    }'
    ```

## Testing Flow



1.  The `POST /orders` request hits the **Order Service**.
2.  The **Order Service** sends a REST request to the **Payment Service**.
3.  The **Payment Service** responds successfully and publishes the transaction to RabbitMQ.
4.  The **Order Service** saves the order (status: `pending`) and returns the response to the user.
5.  The **Payment Service** worker consumes the RabbitMQ message and saves the transaction history in the database.

```bash
bun run test
```

## Running Tests Locally

To run the unit and integration tests for each service locally (outside of Docker), you need to have Node.js installed.

1.  Navigate into a service directory (e.g., `cd order-service`).
2.  Install dependencies: `bun install`
3.  Run tests: `bunx jest`

*Note: Tests use `mongodb-memory-server` and mock external services, so you do not need MongoDB or RabbitMQ running locally to execute the test suites.*
