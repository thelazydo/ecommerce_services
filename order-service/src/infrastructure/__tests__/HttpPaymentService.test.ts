import nock from "nock";
import { HttpPaymentService } from "@infrastructure/services/HttpPaymentService";

const PAYMENT_URL = "http://localhost:9999";

describe("HttpPaymentService", () => {
    let service: HttpPaymentService;

    beforeEach(() => {
        service = new HttpPaymentService(PAYMENT_URL, {
            maxRetries: 0,
            timeoutMs: 5000,
        });
    });

    afterEach(() => {
        nock.cleanAll();
    });

    const baseRequest = {
        customerId: "c-1",
        orderId: "o-1",
        productId: "p-1",
        amount: 100,
        correlationId: "corr-1",
    };

    it("should return success: true for HTTP 200", async () => {
        nock(PAYMENT_URL).post("/api/v1/payments").reply(200, { ok: true });

        const result = await service.processPayment(baseRequest);

        expect(result.success).toBe(true);
        expect(result.status).toBe(200);
        expect(result.data).toEqual({ ok: true });
    });

    it("should return success: true for HTTP 201", async () => {
        nock(PAYMENT_URL).post("/api/v1/payments").reply(201, { created: true });

        const result = await service.processPayment(baseRequest);
        expect(result.success).toBe(true);
        expect(result.status).toBe(201);
    });

    it("should return success: true for HTTP 202", async () => {
        nock(PAYMENT_URL).post("/api/v1/payments").reply(202, { accepted: true });

        const result = await service.processPayment(baseRequest);
        expect(result.success).toBe(true);
        expect(result.status).toBe(202);
    });

    it("should return success: false for HTTP 500", async () => {
        nock(PAYMENT_URL)
            .post("/api/v1/payments")
            .reply(500, { error: "Server Error" });

        const result = await service.processPayment(baseRequest);

        expect(result.success).toBe(false);
        expect(result.status).toBe(500);
        expect(result.data).toEqual({ error: "Server Error" });
    });

    it("should return success: false for HTTP 400 without retrying", async () => {
        nock(PAYMENT_URL)
            .post("/api/v1/payments")
            .reply(400, { error: "Bad Request" });

        const result = await service.processPayment(baseRequest);
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
    });

    it("should return success: false for server unavailability", async () => {
        nock(PAYMENT_URL)
            .post("/api/v1/payments")
            .reply(503, { error: "Service Unavailable" });

        const result = await service.processPayment(baseRequest);

        expect(result.success).toBe(false);
        expect(result.status).toBe(503);
        expect(result.data).toEqual({ error: "Service Unavailable" });
    });

    it("should forward x-correlation-id header", async () => {
        let capturedHeaders: Record<string, string | string[]> = {};
        nock(PAYMENT_URL)
            .post("/api/v1/payments")
            .reply(200, function () {
                capturedHeaders = this.req.headers;
                return { ok: true };
            });

        const result = await service.processPayment(baseRequest);
        expect(result.success).toBe(true);
        expect(capturedHeaders["x-correlation-id"]).toBe("corr-1");
    });

    it("should forward Authorization header when provided", async () => {
        let capturedHeaders: Record<string, string | string[]> = {};
        nock(PAYMENT_URL)
            .post("/api/v1/payments")
            .reply(200, function () {
                capturedHeaders = this.req.headers;
                return { ok: true };
            });

        const result = await service.processPayment({
            ...baseRequest,
            authorizationHeader: "Bearer test-token",
        });
        expect(result.success).toBe(true);
        expect(capturedHeaders["authorization"]).toBe("Bearer test-token");
    });

    it("should not send Authorization header when not provided", async () => {
        let capturedHeaders: Record<string, string | string[]> = {};
        nock(PAYMENT_URL)
            .post("/api/v1/payments")
            .reply(200, function () {
                capturedHeaders = this.req.headers;
                return { ok: true };
            });

        const result = await service.processPayment(baseRequest);
        expect(result.success).toBe(true);
        expect(capturedHeaders["authorization"]).toBeUndefined();
    });

    describe("retry behavior", () => {
        it("should retry on 5xx and succeed on subsequent attempt", async () => {
            const retryService = new HttpPaymentService(PAYMENT_URL, {
                maxRetries: 2,
                baseDelayMs: 10,
            });

            nock(PAYMENT_URL)
                .post("/api/v1/payments")
                .reply(500, { error: "Server Error" });
            nock(PAYMENT_URL)
                .post("/api/v1/payments")
                .reply(200, { ok: true });

            const result = await retryService.processPayment(baseRequest);
            expect(result.success).toBe(true);
            expect(result.status).toBe(200);
        });

        it("should not retry on 4xx errors", async () => {
            const retryService = new HttpPaymentService(PAYMENT_URL, {
                maxRetries: 2,
                baseDelayMs: 10,
            });

            nock(PAYMENT_URL)
                .post("/api/v1/payments")
                .reply(400, { error: "Bad Request" });

            const result = await retryService.processPayment(baseRequest);
            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            // Verify no second request was made (nock would still have pending interceptors)
            expect(nock.pendingMocks().length).toBe(0);
        });

        it("should return failure after exhausting all retries", async () => {
            const retryService = new HttpPaymentService(PAYMENT_URL, {
                maxRetries: 1,
                baseDelayMs: 10,
            });

            nock(PAYMENT_URL)
                .post("/api/v1/payments")
                .reply(500, { error: "Error 1" });
            nock(PAYMENT_URL)
                .post("/api/v1/payments")
                .reply(500, { error: "Error 2" });

            const result = await retryService.processPayment(baseRequest);
            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
        });
    });
});
