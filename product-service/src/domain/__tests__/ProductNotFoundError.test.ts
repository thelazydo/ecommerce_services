import { ProductNotFoundError } from "@domain/errors/ProductNotFoundError";

describe("ProductNotFoundError", () => {
    it("should have the correct name", () => {
        const error = new ProductNotFoundError("p-1");
        expect(error.name).toBe("ProductNotFoundError");
    });

    it("should include the id in the message", () => {
        const error = new ProductNotFoundError("p-1");
        expect(error.message).toContain("p-1");
    });

    it("should be an instance of Error", () => {
        const error = new ProductNotFoundError("p-1");
        expect(error).toBeInstanceOf(Error);
    });
});
