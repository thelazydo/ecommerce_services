import {
    ProcessPaymentUseCase,
    MessagePublisherNotReadyError,
} from "@application/use-cases/ProcessPaymentUseCase";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { IMessagePublisher } from "@application/interfaces/IMessagePublisher";
import { Transaction } from "@domain/entities/Transaction";

describe("ProcessPaymentUseCase", () => {
    let mockRepo: jest.Mocked<ITransactionRepository>;
    let mockPublisher: jest.Mocked<IMessagePublisher>;
    let useCase: ProcessPaymentUseCase;

    const request = {
        customerId: "c-1",
        orderId: "o-1",
        productId: "p-1",
        amount: 100,
        correlationId: "corr-1",
    };

    beforeEach(() => {
        mockRepo = {
            findByOrderId: jest.fn(),
            save: jest.fn(),
        };
        mockPublisher = {
            publish: jest.fn(),
            isReady: jest.fn().mockReturnValue(true),
        };
        useCase = new ProcessPaymentUseCase(mockRepo, mockPublisher);
    });

    it("should publish when no existing transaction exists", async () => {
        mockRepo.findByOrderId.mockResolvedValue(null);

        const result = await useCase.execute(request);

        expect(result.message).toBe("Payment processed and published");
        expect(result.idempotent).toBeUndefined();
        expect(mockPublisher.publish).toHaveBeenCalledWith(
            "payment.processed",
            expect.objectContaining({
                customerId: "c-1",
                orderId: "o-1",
                amount: 100,
            }),
        );
    });

    it("should return idempotent response when transaction already exists", async () => {
        mockRepo.findByOrderId.mockResolvedValue(
            new Transaction("t-1", "c-1", "o-1", "p-1", 100, "success", new Date()),
        );

        const result = await useCase.execute(request);

        expect(result.message).toBe("Payment already processed");
        expect(result.idempotent).toBe(true);
        expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it("should throw when publisher is not ready", async () => {
        mockRepo.findByOrderId.mockResolvedValue(null);
        mockPublisher.isReady.mockReturnValue(false);

        await expect(useCase.execute(request)).rejects.toThrow(
            MessagePublisherNotReadyError,
        );
        expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it("should check existing transaction first before checking publisher", async () => {
        mockRepo.findByOrderId.mockResolvedValue(
            new Transaction("t-1", "c-1", "o-1", "p-1", 100, "success", new Date()),
        );
        mockPublisher.isReady.mockReturnValue(false);

        // Even though publisher is not ready, idempotency should return early
        const result = await useCase.execute(request);
        expect(result.idempotent).toBe(true);
    });
});
