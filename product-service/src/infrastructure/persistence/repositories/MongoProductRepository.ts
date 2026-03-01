import { Product } from "@domain/entities/Product";
import { IProductRepository } from "@domain/repositories/IProductRepository";
import { ProductModel } from "@infrastructure/persistence/mongoose-models/ProductModel";
import { ProductMapper } from "@infrastructure/persistence/mappers/ProductMapper";

export class MongoProductRepository implements IProductRepository {
    async findById(id: string): Promise<Product | null> {
        const doc = await ProductModel.findById(id);
        return doc ? ProductMapper.toDomain(doc) : null;
    }

    async findByName(name: string): Promise<Product | null> {
        const doc = await ProductModel.findOne({ name });
        return doc ? ProductMapper.toDomain(doc) : null;
    }

    async save(product: Product): Promise<Product> {
        const data = ProductMapper.toDocument(product);
        const doc = new ProductModel(data);
        const saved = await doc.save();
        return ProductMapper.toDomain(saved);
    }
}
