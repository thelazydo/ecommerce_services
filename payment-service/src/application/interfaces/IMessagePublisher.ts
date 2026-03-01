export interface PaymentMessagePayload {
    customerId: string;
    orderId: string;
    productId: string;
    amount: number;
    correlationId: string;
}

export interface IMessagePublisher {
    publish(queue: string, payload: PaymentMessagePayload): void;
    isReady(): boolean;
}
