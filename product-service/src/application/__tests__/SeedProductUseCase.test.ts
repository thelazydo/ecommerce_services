import { SeedProductUseCase } from "@application/use-cases/SeedProductUseCase";
import { IProductRepository } from "@domain/repositories/IProductRepository";
import { IAuditLogger } from "@application/interfaces/IAuditLogger";
import { Product } from "@domain/entities/Product";

describe("SeedProductUseCase", () => {
    let mockRepo: jest.Mocked<IProductRepository>;
    let mockAuditLogger: jest.Mocked<IAuditLogger>;
    let useCase: SeedProductUseCase;

    beforeEach(() => {
        mockRepo = {
            findById: jest.fn(),
            findByName: jest.fn(),
            save: jest.fn(),
        };
        mockAuditLogger = { log: jest.fn().mockResolvedValue(undefined) };
        useCase = new SeedProductUseCase(mockRepo, mockAuditLogger);
    });

    it("should create a new product when none exists", async () => {
        mockRepo.findByName.mockResolvedValue(null);
        mockRepo.save.mockResolvedValue(
            new Product("p-1", "Awesome Gadget", 99.99, "A really awesome gadget for all your needs"),
        );

        const result = await useCase.execute({ actorId: "admin", correlationId: "c-1" });

        expect(mockRepo.save).toHaveBeenCalledTimes(1);
        expect(result.id).toBe("p-1");
        expect(result.name).toBe("Awesome Gadget");
        expect(result.price).toBe(99.99);
    });

    it("should return existing product when already seeded", async () => {
        const existing = new Product("existing-p", "Awesome Gadget", 99.99, "desc");
        mockRepo.findByName.mockResolvedValue(existing);

        const result = await useCase.execute({ actorId: "admin", correlationId: "c-2" });

        expect(mockRepo.save).not.toHaveBeenCalled();
        expect(result.id).toBe("existing-p");
    });

    it("should log an audit entry", async () => {
        mockRepo.findByName.mockResolvedValue(null);
        mockRepo.save.mockResolvedValue(new Product("p-2", "Awesome Gadget", 99.99));

        await useCase.execute({ actorId: "admin", correlationId: "c-3" });

        expect(mockAuditLogger.log).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "PRODUCT_SEEDED",
                entityId: "p-2",
                entityType: "Product",
            }),
        );
    });
});
