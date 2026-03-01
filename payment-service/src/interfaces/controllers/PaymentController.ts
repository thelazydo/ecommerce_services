import { Request, Response } from "express";
import { MessagePublisherNotReadyError, ProcessPaymentUseCase } from "@application/use-cases/ProcessPaymentUseCase";
import { z } from "zod";

const paymentValidationSchema = z.object({
    customerId: z.string().min(1, "customerId is required"),
    orderId: z.string().min(1, "orderId is required"),
    productId: z.string().min(1, "productId is required"),
    amount: z.number().positive("amount must be positive"),
});

export class PaymentController {
    constructor(private readonly processPaymentUseCase: ProcessPaymentUseCase) { }

    processPayment = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationResult = paymentValidationSchema.safeParse(req.body);

            if (!validationResult.success) {
                req.log.warn(
                    { issues: validationResult.error.issues },
                    "Validation failed",
                );
                return res.status(400).json({
                    error: "Missing required fields",
                    details: validationResult.error.issues,
                });
            }

            const { customerId, orderId, productId, amount } = validationResult.data;

            const result = await this.processPaymentUseCase.execute({
                customerId,
                orderId,
                productId,
                amount,
                correlationId: req.correlationId,
            });

            req.log.info({ payload: { customerId, orderId, productId, amount } }, "Payment processed");

            if (result.idempotent) {
                return res.status(200).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            if (error instanceof MessagePublisherNotReadyError) {
                req.log.error("RabbitMQ channel not available");
                return res
                    .status(503)
                    .json({ error: "RabbitMQ channel not available" });
            }

            req.log.error({ err: error }, "Payment processing failed");
            return res
                .status(500)
                .json({ error: "Failed to process payment", details: error.message });
        }
    };
}
