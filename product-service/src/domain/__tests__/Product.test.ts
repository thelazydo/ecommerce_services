import { Product } from "@domain/entities/Product";

describe("Product Entity", () => {
    it("should create a product with all properties", () => {
        const product = new Product("id-1", "Widget", 29.99, "A nice widget");

        expect(product.id).toBe("id-1");
        expect(product.name).toBe("Widget");
        expect(product.price).toBe(29.99);
        expect(product.description).toBe("A nice widget");
    });

    it("should allow optional description", () => {
        const product = new Product("id-2", "Gadget", 9.99);
        expect(product.description).toBeUndefined();
    });

    it("should allow mutable name and price", () => {
        const product = new Product("id-1", "Old", 10);
        product.name = "New";
        product.price = 20;
        expect(product.name).toBe("New");
        expect(product.price).toBe(20);
    });
});
