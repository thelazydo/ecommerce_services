import { Product } from "@domain/entities/Product";
import { IProductRepository } from "@domain/repositories/IProductRepository";
import { IAuditLogger } from "@application/interfaces/IAuditLogger";
import {
    SeedProductRequest,
    SeedProductResponse,
} from "@application/dtos/SeedProductDTO";

const SEED_DATA = {
    name: "Awesome Gadget",
    price: 99.99,
    description: "A really awesome gadget for all your needs",
};

export class SeedProductUseCase {
    constructor(
        private readonly productRepository: IProductRepository,
        private readonly auditLogger: IAuditLogger
    ) {}

    async execute(request: SeedProductRequest): Promise<SeedProductResponse> {
        let product = await this.productRepository.findByName(SEED_DATA.name);

        if (!product) {
            product = new Product(
                "",
                SEED_DATA.name,
                SEED_DATA.price,
                SEED_DATA.description
            );
            product = await this.productRepository.save(product);
        }

        await this.auditLogger.log({
            action: "PRODUCT_SEEDED",
            entityId: product.id,
            entityType: "Product",
            actorId: request.actorId,
            correlationId: request.correlationId,
        });

        return {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
        };
    }
}
