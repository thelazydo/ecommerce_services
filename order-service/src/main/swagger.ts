import { Express } from "express";
import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
    openapi: "3.0.3",
    info: {
        title: "Order Service API",
        version: "1.0.0",
        description:
            "Manages order creation. Coordinates with payment-service to process payments.",
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
            CreateOrderRequest: {
                type: "object",
                required: ["customerId", "productId", "amount"],
                properties: {
                    customerId: { type: "string", example: "cust-123" },
                    productId: { type: "string", example: "prod-456" },
                    amount: { type: "number", example: 99.99 },
                },
            },
            OrderResponse: {
                type: "object",
                properties: {
                    orderId: { type: "string" },
                    customerId: { type: "string" },
                    productId: { type: "string" },
                    amount: { type: "number" },
                    orderStatus: {
                        type: "string",
                        enum: ["pending", "completed", "failed"],
                    },
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
        "/orders": {
            post: {
                summary: "Create a new order",
                tags: ["Orders"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateOrderRequest",
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Order created",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/OrderResponse",
                                },
                            },
                        },
                    },
                    "400": { description: "Validation failed" },
                    "401": { description: "Unauthorized" },
                    "502": { description: "Payment service failure" },
                },
            },
        },
    },
};

export function setupSwagger(app: Express): void {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
