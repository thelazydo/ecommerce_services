import { Request, Response } from "express";
import { SeedProductUseCase } from "@application/use-cases/SeedProductUseCase";
import { GetProductUseCase } from "@application/use-cases/GetProductUseCase";
import { ProductNotFoundError } from "@domain/errors/ProductNotFoundError";
import { z } from "zod";
import jwt from "jsonwebtoken";

const productIdParamSchema = z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid product ID format"),
});

function extractActorId(req: Request): string {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.decode(token) as any;
            if (decoded && (decoded.sub || decoded.userId || decoded.id)) {
                return decoded.sub || decoded.userId || decoded.id;
            }
        }
    } catch {
        // ignore
    }
    return "unknown";
}

export class ProductController {
    constructor(
        private readonly seedProductUseCase: SeedProductUseCase,
        private readonly getProductUseCase: GetProductUseCase,
    ) { }

    seed = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = await this.seedProductUseCase.execute({
                actorId: extractActorId(req),
                correlationId: req.correlationId,
            });

            req.log.info({ productId: result.id }, "Product seeded");
            return res.status(201).json({
                _id: result.id,
                name: result.name,
                price: result.price,
                description: result.description,
            });
        } catch (error: any) {
            req.log.error({ err: error }, "Failed to seed product");
            return res
                .status(500)
                .json({ error: "Failed to seed product", details: error.message });
        }
    };

    getById = async (req: Request, res: Response): Promise<any> => {
        try {
            const paramValidation = productIdParamSchema.safeParse(req.params);
            if (!paramValidation.success) {
                req.log.warn(
                    { issues: paramValidation.error.issues },
                    "Validation failed",
                );
                return res.status(400).json({
                    error: "Validation failed",
                    details: paramValidation.error.issues,
                });
            }

            const result = await this.getProductUseCase.execute({
                id: paramValidation.data.id,
            });

            req.log.info({ productId: result.id }, "Product fetched");
            return res.status(200).json({
                _id: result.id,
                name: result.name,
                price: result.price,
                description: result.description,
            });
        } catch (error: any) {
            if (error instanceof ProductNotFoundError) {
                req.log.warn(
                    { productId: req.params.id },
                    "Product not found",
                );
                return res.status(404).json({ error: "Product not found" });
            }

            req.log.error(
                { err: error, productId: req.params.id },
                "Failed to fetch product",
            );
            return res
                .status(500)
                .json({ error: "Failed to fetch product", details: error.message });
        }
    };
}
