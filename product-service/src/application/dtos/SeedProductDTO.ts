export interface SeedProductRequest {
    actorId: string;
    correlationId: string;
}

export interface SeedProductResponse {
    id: string;
    name: string;
    price: number;
    description?: string;
}
