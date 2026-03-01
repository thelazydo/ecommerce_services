export interface CreateOrderRequest {
    customerId: string;
    productId: string;
    amount: number;
    correlationId: string;
    actorId: string;
    authorizationHeader?: string;
}

export interface CreateOrderResponse {
    customerId: string;
    orderId: string;
    productId: string;
    orderStatus: string;
}
