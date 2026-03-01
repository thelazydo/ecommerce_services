import { Product } from "@domain/entities/Product";
import { IProductDocument } from "@infrastructure/persistence/mongoose-models/ProductModel";

export class ProductMapper {
    static toDomain(doc: IProductDocument): Product {
        return new Product(
            doc._id.toString(),
            doc.name,
            doc.price,
            doc.description,
        );
    }

    static toDocument(entity: Product): Partial<IProductDocument> {
        return {
            name: entity.name,
            price: entity.price,
            description: entity.description,
        };
    }
}
