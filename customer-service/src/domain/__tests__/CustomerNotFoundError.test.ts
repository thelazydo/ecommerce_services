import { CustomerNotFoundError } from "@domain/errors/CustomerNotFoundError";

describe("CustomerNotFoundError", () => {
    it("should have the correct name", () => {
        const error = new CustomerNotFoundError("abc-123");
        expect(error.name).toBe("CustomerNotFoundError");
    });

    it("should include the id in the message", () => {
        const error = new CustomerNotFoundError("abc-123");
        expect(error.message).toContain("abc-123");
    });

    it("should be an instance of Error", () => {
        const error = new CustomerNotFoundError("abc-123");
        expect(error).toBeInstanceOf(Error);
    });
});
