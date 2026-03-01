export interface GetProductRequest {
    id: string;
}

export interface GetProductResponse {
    id: string;
    name: string;
    price: number;
    description?: string;
}
