export interface SaveTransactionRequest {
    customerId: string;
    orderId: string;
    productId: string;
    amount: number;
    correlationId: string;
}
