import { Order } from "@domain/entities/Order";

describe("Order Entity", () => {
    it("should create an order with all properties", () => {
        const order = new Order("o-1", "c-1", "p-1", 99.99, "pending");

        expect(order.id).toBe("o-1");
        expect(order.customerId).toBe("c-1");
        expect(order.productId).toBe("p-1");
        expect(order.amount).toBe(99.99);
        expect(order.orderStatus).toBe("pending");
    });

    it("should allow mutable status", () => {
        const order = new Order("o-1", "c-1", "p-1", 50, "pending");
        order.orderStatus = "failed";
        expect(order.orderStatus).toBe("failed");
    });
});
