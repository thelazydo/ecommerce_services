import { Express } from "express";
import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
    openapi: "3.0.3",
    info: {
        title: "Customer Service API",
        version: "1.0.0",
        description: "Manages customer entities. Provides seeding and retrieval.",
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
            Customer: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "665a1b2c3d4e5f6a7b8c9d0e" },
                    name: { type: "string", example: "John Doe" },
                    email: { type: "string", example: "john@example.com" },
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
        "/customers/seed": {
            post: {
                summary: "Seed a default customer",
                tags: ["Customers"],
                responses: {
                    "201": {
                        description: "Customer created/returned",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Customer" },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "500": { description: "Internal Server Error" },
                },
            },
        },
        "/customers/{id}": {
            get: {
                summary: "Get customer by ID",
                tags: ["Customers"],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                        description: "MongoDB ObjectId",
                    },
                ],
                responses: {
                    "200": {
                        description: "Customer found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Customer" },
                            },
                        },
                    },
                    "400": { description: "Invalid ID format" },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Customer not found" },
                },
            },
        },
    },
};

export function setupSwagger(app: Express): void {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
