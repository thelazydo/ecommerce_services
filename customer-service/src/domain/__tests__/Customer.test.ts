import { Customer } from "@domain/entities/Customer";

describe("Customer Entity", () => {
    it("should create a customer with all properties", () => {
        const customer = new Customer("id-1", "John Doe", "john@example.com");

        expect(customer.id).toBe("id-1");
        expect(customer.name).toBe("John Doe");
        expect(customer.email).toBe("john@example.com");
    });

    it("should have readonly id", () => {
        const customer = new Customer("id-1", "Jane", "jane@example.com");

        // id is readonly — verify it cannot be reassigned
        expect(customer.id).toBe("id-1");
    });

    it("should allow mutable name and email", () => {
        const customer = new Customer("id-1", "Old Name", "old@example.com");

        customer.name = "New Name";
        customer.email = "new@example.com";

        expect(customer.name).toBe("New Name");
        expect(customer.email).toBe("new@example.com");
    });
});
