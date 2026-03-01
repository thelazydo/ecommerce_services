import { MongoProductRepository } from "@infrastructure/persistence/repositories/MongoProductRepository";
import { MongoAuditLogger } from "@infrastructure/services/MongoAuditLogger";
import { SeedProductUseCase } from "@application/use-cases/SeedProductUseCase";
import { GetProductUseCase } from "@application/use-cases/GetProductUseCase";
import { ProductController } from "../interfaces/controllers/ProductController";
import { logger } from "@main/config";

const productRepository = new MongoProductRepository();
const auditLogger = new MongoAuditLogger();

const seedProductUseCase = new SeedProductUseCase(
    productRepository,
    auditLogger,
);
const getProductUseCase = new GetProductUseCase(productRepository);

const productController = new ProductController(
    seedProductUseCase,
    getProductUseCase,
);

export const container = {
    productRepository,
    auditLogger,
    seedProductUseCase,
    getProductUseCase,
    productController,
};
