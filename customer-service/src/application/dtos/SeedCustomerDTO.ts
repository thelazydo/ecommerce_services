export interface SeedCustomerRequest {
    actorId: string;
    correlationId: string;
}

export interface SeedCustomerResponse {
    id: string;
    name: string;
    email: string;
}
