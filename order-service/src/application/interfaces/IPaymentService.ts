export interface PaymentRequest {
    customerId: string;
    orderId: string;
    productId: string;
    amount: number;
    correlationId: string;
    authorizationHeader?: string;
}

export interface PaymentResponse {
    success: boolean;
    status: number;
    data: any;
}

export interface IPaymentService {
    processPayment(request: PaymentRequest): Promise<PaymentResponse>;
}
