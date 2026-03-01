import { IProductRepository } from "@domain/repositories/IProductRepository";
import { ProductNotFoundError } from "@domain/errors/ProductNotFoundError";
import {
    GetProductRequest,
    GetProductResponse,
} from "@application/dtos/GetProductDTO";

export class GetProductUseCase {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(request: GetProductRequest): Promise<GetProductResponse> {
        const product = await this.productRepository.findById(request.id);

        if (!product) {
            throw new ProductNotFoundError(request.id);
        }

        return {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
        };
    }
}
