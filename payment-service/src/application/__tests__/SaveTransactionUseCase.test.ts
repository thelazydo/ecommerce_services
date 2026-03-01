import { SaveTransactionUseCase } from "@application/use-cases/SaveTransactionUseCase";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { IAuditLogger } from "@application/interfaces/IAuditLogger";
import { Transaction } from "@domain/entities/Transaction";

describe("SaveTransactionUseCase", () => {
    let mockRepo: jest.Mocked<ITransactionRepository>;
    let mockAuditLogger: jest.Mocked<IAuditLogger>;
    let useCase: SaveTransactionUseCase;

    beforeEach(() => {
        mockRepo = {
            findByOrderId: jest.fn(),
            save: jest.fn(),
        };
        mockAuditLogger = { log: jest.fn().mockResolvedValue(undefined) };
        useCase = new SaveTransactionUseCase(mockRepo, mockAuditLogger);
    });

    it("should save a transaction with status success", async () => {
        mockRepo.save.mockImplementation(
            async (txn) =>
                new Transaction(
                    "saved-id",
                    txn.customerId,
                    txn.orderId,
                    txn.productId,
                    txn.amount,
                    txn.status,
                    txn.createdAt
                )
        );

        const result = await useCase.execute({
            customerId: "c-1",
            orderId: "o-1",
            productId: "p-1",
            amount: 100,
            correlationId: "corr-1",
        });

        expect(result.id).toBe("saved-id");
        expect(result.status).toBe("success");
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it("should log an audit entry after saving", async () => {
        mockRepo.save.mockImplementation(
            async (txn) =>
                new Transaction(
                    "t-id",
                    txn.customerId,
                    txn.orderId,
                    txn.productId,
                    txn.amount,
                    txn.status,
                    txn.createdAt
                )
        );

        await useCase.execute({
            customerId: "c-1",
            orderId: "o-1",
            productId: "p-1",
            amount: 50,
            correlationId: "corr-2",
        });

        expect(mockAuditLogger.log).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "PAYMENT_PROCESSED",
                entityId: "t-id",
                entityType: "Transaction",
                actorId: "system",
                correlationId: "corr-2",
            })
        );
    });
});
