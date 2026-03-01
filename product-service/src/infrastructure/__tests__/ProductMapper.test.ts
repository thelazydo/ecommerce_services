import { ProductMapper } from "@infrastructure/persistence/mappers/ProductMapper";
import { Product } from "@domain/entities/Product";

describe("ProductMapper", () => {
    describe("toDomain", () => {
        it("should map a Mongoose document to a Product entity", () => {
            const mockDoc = {
                _id: { toString: () => "doc-id" },
                name: "Widget",
                price: 29.99,
                description: "A widget",
            } as any;

            const product = ProductMapper.toDomain(mockDoc);

            expect(product).toBeInstanceOf(Product);
            expect(product.id).toBe("doc-id");
            expect(product.name).toBe("Widget");
            expect(product.price).toBe(29.99);
            expect(product.description).toBe("A widget");
        });
    });

    describe("toDocument", () => {
        it("should map a Product entity to a partial document", () => {
            const product = new Product("id", "Gadget", 9.99, "desc");
            const doc = ProductMapper.toDocument(product);

            expect(doc).toEqual({
                name: "Gadget",
                price: 9.99,
                description: "desc",
            });
            expect(doc).not.toHaveProperty("_id");
        });
    });
});
