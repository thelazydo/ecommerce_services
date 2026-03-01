import { Transaction } from "@domain/entities/Transaction";

describe("Transaction Entity", () => {
    it("should create a transaction with all properties", () => {
        const now = new Date();
        const txn = new Transaction(
            "t-1",
            "c-1",
            "o-1",
            "p-1",
            100,
            "success",
            now
        );

        expect(txn.id).toBe("t-1");
        expect(txn.customerId).toBe("c-1");
        expect(txn.orderId).toBe("o-1");
        expect(txn.productId).toBe("p-1");
        expect(txn.amount).toBe(100);
        expect(txn.status).toBe("success");
        expect(txn.createdAt).toBe(now);
    });

    it("should allow mutable status", () => {
        const txn = new Transaction(
            "t-1",
            "c-1",
            "o-1",
            "p-1",
            50,
            "pending",
            new Date()
        );
        txn.status = "success";
        expect(txn.status).toBe("success");
    });
});
