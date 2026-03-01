
Scenario:

You have been hired as a software engineer, backend, in an e-commerce firm that is currently migrating its API-driven architecture to microservices, and your first task is to make the customer, product, order, and payment services communicate seamlessly.

Guide:

Create the following services

- Customer service

- Product service

- Order service

- Payment service



Procedure:

When a customer makes an order, a message/request (containing data like customerId, productId, amount, etc.) should be sent to the order service using a REST (RESTful) based communication.
The order service, in turn, sends a request (containing customerId, orderId, amount) to the payment service. The order (which should contain the customerId, productId, orderId, amount, and orderStatus [pending]) should be saved in the database, and also a response (this response should contain the customerId, orderId, productId, and orderStatus)should be sent back to the customer.
The payment service should publish transaction details (customerId, orderId, productId, and amount) to a RabbitMQ messaging queue, and a worker at the end of the queue should save the queued data in the database transaction history.

Please refer to the image below for a diagram of the entire process flow for the procedure enumerated above:
./Ecommerce-Microservices.png



Constraints:

- Seed a user (the customer) in the database, and also seed some data for the products
- We are assuming the customer is only ordering a single product
- Use Node.js/Express.js as the backend technology and MongoDB as the database (datastore)
- Use RabbitMQ (for asynchronous) service-to-service communication
- Code should be properly documented and tested
- Use Docker and Docker Compose to build the application locally
- Payment service should be very simple, and for demonstration purposes only, don’t implement an actual payment service.
