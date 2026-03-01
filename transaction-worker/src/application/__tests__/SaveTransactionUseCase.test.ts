import { SaveTransactionUseCase } from "@application/use-cases/SaveTransactionUseCase";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { Transaction } from "@domain/entities/Transaction";

describe("SaveTransactionUseCase", () => {
    let useCase: SaveTransactionUseCase;
    let mockRepo: jest.Mocked<ITransactionRepository>;

    beforeEach(() => {
        mockRepo = {
            save: jest.fn(),
        };
        useCase = new SaveTransactionUseCase(mockRepo);
    });

    it("should successfully save a transaction", async () => {
        const expectedTransaction = new Transaction(
            "tx-123",
            "customer-1",
            "order-1",
            "prod-1",
            99.99,
            "success",
            new Date(),
        );

        mockRepo.save.mockResolvedValue(expectedTransaction);

        const request = {
            customerId: "customer-1",
            orderId: "order-1",
            productId: "prod-1",
            amount: 99.99,
            correlationId: "corr-1",
        };

        const result = await useCase.execute(request);

        expect(result).toBe(expectedTransaction);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);

        const savedArg = mockRepo.save.mock.calls[0][0];
        expect(savedArg.customerId).toBe("customer-1");
        expect(savedArg.orderId).toBe("order-1");
        expect(savedArg.productId).toBe("prod-1");
        expect(savedArg.amount).toBe(99.99);
        expect(savedArg.status).toBe("success");
    });

    it("should throw if repository fails to save", async () => {
        const error = new Error("Database error");
        mockRepo.save.mockRejectedValue(error);

        const request = {
            customerId: "customer-1",
            orderId: "order-1",
            productId: "prod-1",
            amount: 99.99,
            correlationId: "corr-1",
        };

        await expect(useCase.execute(request)).rejects.toThrow(error);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });
});
