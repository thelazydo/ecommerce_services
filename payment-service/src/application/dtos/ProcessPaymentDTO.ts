export interface ProcessPaymentRequest {
    customerId: string;
    orderId: string;
    productId: string;
    amount: number;
    correlationId: string;
}

export interface ProcessPaymentResponse {
    message: string;
    idempotent?: boolean;
}
