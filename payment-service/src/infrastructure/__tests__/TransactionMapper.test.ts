import { TransactionMapper } from "@infrastructure/persistence/mappers/TransactionMapper";
import { Transaction } from "@domain/entities/Transaction";

describe("TransactionMapper", () => {
    describe("toDomain", () => {
        it("should map a Mongoose document to a Transaction entity", () => {
            const now = new Date();
            const mockDoc = {
                _id: { toString: () => "doc-id" },
                customerId: "c-1",
                orderId: "o-1",
                productId: "p-1",
                amount: 100,
                status: "success",
                createdAt: now,
            } as any;

            const txn = TransactionMapper.toDomain(mockDoc);

            expect(txn).toBeInstanceOf(Transaction);
            expect(txn.id).toBe("doc-id");
            expect(txn.customerId).toBe("c-1");
            expect(txn.orderId).toBe("o-1");
            expect(txn.amount).toBe(100);
            expect(txn.status).toBe("success");
            expect(txn.createdAt).toBe(now);
        });
    });

    describe("toDocument", () => {
        it("should map a Transaction entity to a partial document", () => {
            const txn = new Transaction("id", "c-1", "o-1", "p-1", 100, "success", new Date());
            const doc = TransactionMapper.toDocument(txn);

            expect(doc).toEqual({
                customerId: "c-1",
                orderId: "o-1",
                productId: "p-1",
                amount: 100,
                status: "success",
            });
            expect(doc).not.toHaveProperty("_id");
        });
    });
});
