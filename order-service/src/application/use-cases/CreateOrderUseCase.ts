import { Order } from "@domain/entities/Order";
import { IOrderRepository } from "@domain/repositories/IOrderRepository";
import { IAuditLogger } from "@application/interfaces/IAuditLogger";
import { IPaymentService } from "@application/interfaces/IPaymentService";
import {
    CreateOrderRequest,
    CreateOrderResponse,
} from "@application/dtos/CreateOrderDTO";

export class CreateOrderUseCase {
    constructor(
        private readonly orderRepository: IOrderRepository,
        private readonly paymentService: IPaymentService,
        private readonly auditLogger: IAuditLogger
    ) {}

    async execute(request: CreateOrderRequest): Promise<CreateOrderResponse> {
        // Save as pending first to avoid dual-write issues
        let order = new Order(
            "",
            request.customerId,
            request.productId,
            request.amount,
            "pending"
        );
        order = await this.orderRepository.save(order);

        // Call payment service
        const paymentResponse = await this.paymentService.processPayment({
            customerId: request.customerId,
            orderId: order.id,
            productId: request.productId,
            amount: request.amount,
            correlationId: request.correlationId,
            authorizationHeader: request.authorizationHeader,
        });

        if (!paymentResponse.success) {
            // Mark as failed
            order = new Order(
                order.id,
                order.customerId,
                order.productId,
                order.amount,
                "failed"
            );
            await this.orderRepository.update(order);
            throw new PaymentFailedError(paymentResponse.data);
        }

        await this.auditLogger.log({
            action: "ORDER_CREATED",
            entityId: order.id,
            entityType: "Order",
            actorId: request.actorId,
            correlationId: request.correlationId,
        });

        return {
            customerId: order.customerId,
            orderId: order.id,
            productId: order.productId,
            orderStatus: order.orderStatus,
        };
    }
}

export class PaymentFailedError extends Error {
    constructor(public readonly details: any) {
        super("Payment service failed to process the request");
        this.name = "PaymentFailedError";
    }
}
