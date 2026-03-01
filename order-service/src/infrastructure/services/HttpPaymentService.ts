import axios, { AxiosError } from "axios";
import {
    IPaymentService,
    PaymentRequest,
    PaymentResponse,
} from "@application/interfaces/IPaymentService";

export enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN",
}

export interface HttpPaymentServiceOptions {
    timeoutMs?: number;
    maxRetries?: number;
    baseDelayMs?: number;
    /** Number of consecutive failures before the circuit opens */
    failureThreshold?: number;
    /** How long the circuit stays OPEN before moving to HALF_OPEN (ms) */
    resetTimeoutMs?: number;
}

export class HttpPaymentService implements IPaymentService {
    private readonly timeoutMs: number;
    private readonly maxRetries: number;
    private readonly baseDelayMs: number;
    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;

    // Circuit breaker state
    private state: CircuitState = CircuitState.CLOSED;
    private consecutiveFailures = 0;
    private lastFailureTime = 0;

    constructor(
        private readonly paymentServiceUrl: string,
        options: HttpPaymentServiceOptions = {},
    ) {
        this.timeoutMs = options.timeoutMs ?? 5000;
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelayMs = options.baseDelayMs ?? 200;
        this.failureThreshold = options.failureThreshold ?? 5;
        this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    }

    getCircuitState(): CircuitState {
        return this.state;
    }

    async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
        // Circuit breaker check
        if (this.state === CircuitState.OPEN) {
            const elapsed = Date.now() - this.lastFailureTime;
            if (elapsed < this.resetTimeoutMs) {
                return {
                    success: false,
                    status: 503,
                    data: "Circuit breaker is OPEN — payment service unavailable",
                };
            }
            // Transition to HALF_OPEN for probe
            this.state = CircuitState.HALF_OPEN;
        }

        const result = await this.executeWithRetry(request);

        // Update circuit breaker state based on result
        if (result.success) {
            this.onSuccess();
        } else if (result.status >= 500) {
            this.onFailure();
        }

        return result;
    }

    private onSuccess(): void {
        this.consecutiveFailures = 0;
        this.state = CircuitState.CLOSED;
    }

    private onFailure(): void {
        this.consecutiveFailures++;
        this.lastFailureTime = Date.now();
        if (this.consecutiveFailures >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
        }
    }

    private async executeWithRetry(
        request: PaymentRequest,
    ): Promise<PaymentResponse> {
        let lastError: any;

        // In HALF_OPEN state, only allow 1 attempt (no retries)
        const maxAttempts =
            this.state === CircuitState.HALF_OPEN ? 0 : this.maxRetries;

        for (let attempt = 0; attempt <= maxAttempts; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }

                const response = await axios.post(
                    `${this.paymentServiceUrl}/api/v1/payments`,
                    {
                        customerId: request.customerId,
                        orderId: request.orderId,
                        productId: request.productId,
                        amount: request.amount,
                    },
                    {
                        timeout: this.timeoutMs,
                        headers: {
                            "x-correlation-id": request.correlationId,
                            ...(request.authorizationHeader
                                ? { Authorization: request.authorizationHeader }
                                : {}),
                        },
                    },
                );

                const isSuccess = [200, 201, 202].includes(response.status);

                return {
                    success: isSuccess,
                    status: response.status,
                    data: response.data,
                };
            } catch (error: any) {
                lastError = error;

                // Don't retry client errors (4xx) — only network/server errors
                if (error.response && error.response.status < 500) {
                    return {
                        success: false,
                        status: error.response.status,
                        data: error.response.data,
                    };
                }

                if (attempt === maxAttempts) {
                    break;
                }
            }
        }

        const details = lastError?.response
            ? lastError.response.data
            : lastError?.message || "Unknown error";

        return {
            success: false,
            status: lastError?.response?.status || 500,
            data: details,
        };
    }
}
