import { Transaction } from "@domain/entities/Transaction";

describe("Transaction Entity", () => {
    it("should instantiate correctly", () => {
        const date = new Date();
        const transaction = new Transaction(
            "tx-123",
            "customer-1",
            "order-1",
            "product-1",
            99.99,
            "success",
            date
        );

        expect(transaction.id).toBe("tx-123");
        expect(transaction.customerId).toBe("customer-1");
        expect(transaction.orderId).toBe("order-1");
        expect(transaction.productId).toBe("product-1");
        expect(transaction.amount).toBe(99.99);
        expect(transaction.status).toBe("success");
        expect(transaction.createdAt).toBe(date);
    });
});
