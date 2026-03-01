import { Express } from "express";
import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
    openapi: "3.0.3",
    info: {
        title: "Payment Service API",
        version: "1.0.0",
        description:
            "Processes payments and publishes results to RabbitMQ for downstream consumers.",
    },
    servers: [{ url: "/api/v1", description: "v1 API" }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http" as const,
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            ProcessPaymentRequest: {
                type: "object",
                required: ["customerId", "orderId", "productId", "amount"],
                properties: {
                    customerId: { type: "string", example: "cust-123" },
                    orderId: { type: "string", example: "order-456" },
                    productId: { type: "string", example: "prod-789" },
                    amount: { type: "number", example: 99.99 },
                },
            },
            PaymentResponse: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    transactionId: { type: "string" },
                    idempotent: { type: "boolean" },
                },
            },
            Error: {
                type: "object",
                properties: {
                    error: { type: "string" },
                    details: { type: "string" },
                },
            },
        },
    },
    security: [{ bearerAuth: [] }],
    paths: {
        "/payments": {
            post: {
                summary: "Process a payment",
                tags: ["Payments"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ProcessPaymentRequest",
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Payment processed (or idempotent hit)",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/PaymentResponse",
                                },
                            },
                        },
                    },
                    "400": { description: "Missing required fields" },
                    "401": { description: "Unauthorized" },
                    "503": { description: "RabbitMQ not available" },
                },
            },
        },
    },
};

export function setupSwagger(app: Express): void {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
