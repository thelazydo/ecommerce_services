import { Request, Response } from "express";
import { SeedCustomerUseCase } from "@application/use-cases/SeedCustomerUseCase";
import { GetCustomerUseCase } from "@application/use-cases/GetCustomerUseCase";
import { CustomerNotFoundError } from "@domain/errors/CustomerNotFoundError";
import { z } from "zod";
import jwt from "jsonwebtoken";

const customerIdParamSchema = z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid customer ID format"),
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

export class CustomerController {
    constructor(
        private readonly seedCustomerUseCase: SeedCustomerUseCase,
        private readonly getCustomerUseCase: GetCustomerUseCase,
    ) { }

    seed = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = await this.seedCustomerUseCase.execute({
                actorId: extractActorId(req),
                correlationId: req.correlationId,
            });

            req.log.info({ customerId: result.id }, "Customer seeded");
            return res.status(201).json({
                _id: result.id,
                name: result.name,
                email: result.email,
            });
        } catch (error: any) {
            req.log.error({ err: error }, "Failed to seed customer");
            return res
                .status(500)
                .json({ error: "Failed to seed customer", details: error.message });
        }
    };

    getById = async (req: Request, res: Response): Promise<any> => {
        try {
            const paramValidation = customerIdParamSchema.safeParse(req.params);
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

            const result = await this.getCustomerUseCase.execute({
                id: paramValidation.data.id,
            });

            req.log.info({ customerId: result.id }, "Customer fetched");
            return res.status(200).json({
                _id: result.id,
                name: result.name,
                email: result.email,
            });
        } catch (error: any) {
            if (error instanceof CustomerNotFoundError) {
                req.log.warn(
                    { customerId: req.params.id },
                    "Customer not found",
                );
                return res.status(404).json({ error: "Customer not found" });
            }

            req.log.error(
                { err: error, customerId: req.params.id },
                "Failed to fetch customer",
            );
            return res
                .status(500)
                .json({ error: "Failed to fetch customer", details: error.message });
        }
    };
}
