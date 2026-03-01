import { OrderMapper } from "@infrastructure/persistence/mappers/OrderMapper";
import { Order } from "@domain/entities/Order";

describe("OrderMapper", () => {
    describe("toDomain", () => {
        it("should map a Mongoose document to an Order entity", () => {
            const mockDoc = {
                _id: { toString: () => "doc-id" },
                customerId: "c-1",
                productId: "p-1",
                amount: 99.99,
                orderStatus: "pending" as const,
            } as any;

            const order = OrderMapper.toDomain(mockDoc);

            expect(order).toBeInstanceOf(Order);
            expect(order.id).toBe("doc-id");
            expect(order.customerId).toBe("c-1");
            expect(order.productId).toBe("p-1");
            expect(order.amount).toBe(99.99);
            expect(order.orderStatus).toBe("pending");
        });
    });

    describe("toDocument", () => {
        it("should map an Order entity to a partial document", () => {
            const order = new Order("id", "c-1", "p-1", 50, "failed");
            const doc = OrderMapper.toDocument(order);

            expect(doc).toEqual({
                customerId: "c-1",
                productId: "p-1",
                amount: 50,
                orderStatus: "failed",
            });
            expect(doc).not.toHaveProperty("_id");
        });
    });
});
