import { CustomerMapper } from "@infrastructure/persistence/mappers/CustomerMapper";
import { Customer } from "@domain/entities/Customer";

describe("CustomerMapper", () => {
    describe("toDomain", () => {
        it("should map a Mongoose document to a Customer entity", () => {
            const mockDoc = {
                _id: { toString: () => "doc-id-1" },
                name: "Test User",
                email: "test@example.com",
            } as any;

            const customer = CustomerMapper.toDomain(mockDoc);

            expect(customer).toBeInstanceOf(Customer);
            expect(customer.id).toBe("doc-id-1");
            expect(customer.name).toBe("Test User");
            expect(customer.email).toBe("test@example.com");
        });
    });

    describe("toDocument", () => {
        it("should map a Customer entity to a partial document", () => {
            const customer = new Customer(
                "entity-id",
                "Test User",
                "test@example.com"
            );

            const doc = CustomerMapper.toDocument(customer);

            expect(doc).toEqual({
                name: "Test User",
                email: "test@example.com",
            });
            // Should not include id — Mongoose generates _id
            expect(doc).not.toHaveProperty("_id");
            expect(doc).not.toHaveProperty("id");
        });
    });
});
