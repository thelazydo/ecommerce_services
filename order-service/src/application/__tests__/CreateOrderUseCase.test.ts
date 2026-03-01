import { CreateOrderUseCase, PaymentFailedError } from "@application/use-cases/CreateOrderUseCase";
import { IOrderRepository } from "@domain/repositories/IOrderRepository";
import { IAuditLogger } from "@application/interfaces/IAuditLogger";
import { IPaymentService } from "@application/interfaces/IPaymentService";
import { Order } from "@domain/entities/Order";

describe("CreateOrderUseCase", () => {
    let mockOrderRepo: jest.Mocked<IOrderRepository>;
    let mockPaymentService: jest.Mocked<IPaymentService>;
    let mockAuditLogger: jest.Mocked<IAuditLogger>;
    let useCase: CreateOrderUseCase;

    const request = {
        customerId: "c-1",
        productId: "p-1",
        amount: 100,
        correlationId: "corr-1",
        actorId: "user-1",
        authorizationHeader: "Bearer token",
    };

    beforeEach(() => {
        mockOrderRepo = {
            findById: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
        };
        mockPaymentService = { processPayment: jest.fn() };
        mockAuditLogger = { log: jest.fn().mockResolvedValue(undefined) };
        useCase = new CreateOrderUseCase(mockOrderRepo, mockPaymentService, mockAuditLogger);

        // Default: save returns order with an id
        mockOrderRepo.save.mockImplementation(async (order) =>
            new Order("saved-id", order.customerId, order.productId, order.amount, order.orderStatus),
        );
    });

    it("should save order as pending before calling payment", async () => {
        mockPaymentService.processPayment.mockResolvedValue({
            success: true,
            status: 200,
            data: {},
        });

        await useCase.execute(request);

        expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
        const savedOrder = mockOrderRepo.save.mock.calls[0][0];
        expect(savedOrder.orderStatus).toBe("pending");
    });

    it("should call payment service with correct data", async () => {
        mockPaymentService.processPayment.mockResolvedValue({
            success: true,
            status: 200,
            data: {},
        });

        await useCase.execute(request);

        expect(mockPaymentService.processPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                customerId: "c-1",
                productId: "p-1",
                amount: 100,
                orderId: "saved-id",
                correlationId: "corr-1",
                authorizationHeader: "Bearer token",
            }),
        );
    });

    it("should return correct response on payment success", async () => {
        mockPaymentService.processPayment.mockResolvedValue({ success: true, status: 200, data: {} });

        const result = await useCase.execute(request);

        expect(result.orderId).toBe("saved-id");
        expect(result.customerId).toBe("c-1");
        expect(result.productId).toBe("p-1");
        expect(result.orderStatus).toBe("pending");
    });

    it("should log an audit entry on success", async () => {
        mockPaymentService.processPayment.mockResolvedValue({ success: true, status: 200, data: {} });

        await useCase.execute(request);

        expect(mockAuditLogger.log).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "ORDER_CREATED",
                entityId: "saved-id",
                entityType: "Order",
                actorId: "user-1",
            }),
        );
    });

    it("should mark order as failed when payment fails", async () => {
        mockPaymentService.processPayment.mockResolvedValue({
            success: false,
            status: 500,
            data: { error: "Internal Server Error" },
        });
        mockOrderRepo.update.mockImplementation(async (order) => order);

        await expect(useCase.execute(request)).rejects.toThrow(PaymentFailedError);

        expect(mockOrderRepo.update).toHaveBeenCalledTimes(1);
        const updatedOrder = mockOrderRepo.update.mock.calls[0][0];
        expect(updatedOrder.orderStatus).toBe("failed");
    });

    it("should throw PaymentFailedError with details", async () => {
        const errorDetails = { error: "Insufficient funds" };
        mockPaymentService.processPayment.mockResolvedValue({
            success: false,
            status: 402,
            data: errorDetails,
        });
        mockOrderRepo.update.mockImplementation(async (order) => order);

        try {
            await useCase.execute(request);
            fail("Should have thrown");
        } catch (e: any) {
            expect(e).toBeInstanceOf(PaymentFailedError);
            expect(e.details).toEqual(errorDetails);
        }
    });

    it("should not log audit on payment failure", async () => {
        mockPaymentService.processPayment.mockResolvedValue({
            success: false,
            status: 500,
            data: {},
        });
        mockOrderRepo.update.mockImplementation(async (order) => order);

        try { await useCase.execute(request); } catch { }

        expect(mockAuditLogger.log).not.toHaveBeenCalled();
    });
});
