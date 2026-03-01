import { Product } from "@domain/entities/Product";

export interface IProductRepository {
    findById(id: string): Promise<Product | null>;
    findByName(name: string): Promise<Product | null>;
    save(product: Product): Promise<Product>;
}
