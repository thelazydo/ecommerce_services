import { GetProductUseCase } from "@application/use-cases/GetProductUseCase";
import { IProductRepository } from "@domain/repositories/IProductRepository";
import { Product } from "@domain/entities/Product";
import { ProductNotFoundError } from "@domain/errors/ProductNotFoundError";

describe("GetProductUseCase", () => {
    let mockRepo: jest.Mocked<IProductRepository>;
    let useCase: GetProductUseCase;

    beforeEach(() => {
        mockRepo = {
            findById: jest.fn(),
            findByName: jest.fn(),
            save: jest.fn(),
        };
        useCase = new GetProductUseCase(mockRepo);
    });

    it("should return product DTO when found", async () => {
        mockRepo.findById.mockResolvedValue(
            new Product("p-1", "Widget", 19.99, "A widget"),
        );

        const result = await useCase.execute({ id: "p-1" });

        expect(result.id).toBe("p-1");
        expect(result.name).toBe("Widget");
        expect(result.price).toBe(19.99);
        expect(result.description).toBe("A widget");
    });

    it("should throw ProductNotFoundError when not found", async () => {
        mockRepo.findById.mockResolvedValue(null);

        await expect(useCase.execute({ id: "missing" })).rejects.toThrow(
            ProductNotFoundError,
        );
    });
});
