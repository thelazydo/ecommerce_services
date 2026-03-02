import { Express } from "express";
import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
    openapi: "3.0.3",
    info: {
        title: "Product Service API",
        version: "1.0.0",
        description:
            "Manages product entities. Provides seeding and retrieval.",
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
            Product: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                        example: "665a1b2c3d4e5f6a7b8c9d0e",
                    },
                    name: { type: "string", example: "Awesome Gadget" },
                    price: { type: "number", example: 99.99 },
                    description: {
                        type: "string",
                        example: "A really awesome gadget",
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
        "/products/seed": {
            post: {
                summary: "Seed a default product",
                tags: ["Products"],
                responses: {
                    "201": {
                        description: "Product created/returned",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Product",
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "500": { description: "Internal Server Error" },
                },
            },
        },
        "/products/{id}": {
            get: {
                summary: "Get product by ID",
                tags: ["Products"],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                            pattern: "^[a-fA-F0-9]{24}$",
                        },
                        description: "MongoDB ObjectId",
                    },
                ],
                responses: {
                    "200": {
                        description: "Product found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Product",
                                },
                            },
                        },
                    },
                    "400": { description: "Invalid ID format" },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Product not found" },
                },
            },
        },
    },
};

export function setupSwagger(app: Express): void {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Swagger UI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          spec: ${JSON.stringify(swaggerDocument)},
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: "BaseLayout",
        });
      };
    </script>
  </body>
</html>`;

    app.get("/api-docs", (req, res) => {
        res.type("html").send(html);
    });
}
