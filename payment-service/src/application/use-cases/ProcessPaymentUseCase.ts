import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { IMessagePublisher } from "@application/interfaces/IMessagePublisher";
import {
    ProcessPaymentRequest,
    ProcessPaymentResponse,
} from "@application/dtos/ProcessPaymentDTO";

export class ProcessPaymentUseCase {
    constructor(
        private readonly transactionRepository: ITransactionRepository,
        private readonly messagePublisher: IMessagePublisher,
    ) { }

    async execute(
        request: ProcessPaymentRequest,
    ): Promise<ProcessPaymentResponse> {
        // Idempotency check
        const existingTransaction =
            await this.transactionRepository.findByOrderId(request.orderId);
        if (existingTransaction) {
            return {
                message: "Payment already processed",
                idempotent: true,
            };
        }

        // Check if publisher is ready
        if (!this.messagePublisher.isReady()) {
            throw new MessagePublisherNotReadyError();
        }

        // Publish to message queue
        this.messagePublisher.publish("payment.processed", {
            customerId: request.customerId,
            orderId: request.orderId,
            productId: request.productId,
            amount: request.amount,
            correlationId: request.correlationId,
        });

        return {
            message: "Payment processed and published",
        };
    }
}

export class MessagePublisherNotReadyError extends Error {
    constructor() {
        super("RabbitMQ channel not available");
        this.name = "MessagePublisherNotReadyError";
    }
}
