import { Request, Response } from "express";
import {
    CreateOrderUseCase,
    PaymentFailedError,
} from "@application/use-cases/CreateOrderUseCase";
import { z } from "zod";
import jwt from "jsonwebtoken";

const orderValidationSchema = z.object({
    customerId: z.string().min(1, "customerId is required"),
    productId: z.string().min(1, "productId is required"),
    amount: z.number().positive("amount must be positive"),
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

export class OrderController {
    constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

    create = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationResult = orderValidationSchema.safeParse(req.body);
            if (!validationResult.success) {
                req.log.warn(
                    { issues: validationResult.error.issues },
                    "Validation failed"
                );
                return res.status(400).json({
                    error: "Validation failed",
                    details: validationResult.error.issues,
                });
            }

            const { customerId, productId, amount } = validationResult.data;

            const result = await this.createOrderUseCase.execute({
                customerId,
                productId,
                amount,
                correlationId: req.correlationId,
                actorId: extractActorId(req),
                authorizationHeader: req.headers.authorization as
                    | string
                    | undefined,
            });

            req.log.info({ orderId: result.orderId }, "Order created");
            return res.status(201).json(result);
        } catch (error: any) {
            if (error instanceof PaymentFailedError) {
                req.log.error({ err: error }, "Payment Service Error");
                return res.status(502).json({
                    error: "Payment service failed to process the request",
                    details: error.details,
                });
            }

            req.log.error({ err: error }, "Failed to create order");
            return res
                .status(500)
                .json({
                    error: "Failed to create order",
                    details: error.message,
                });
        }
    };
}
