import { MongoOrderRepository } from "@infrastructure/persistence/repositories/MongoOrderRepository";
import { MongoAuditLogger } from "@infrastructure/services/MongoAuditLogger";
import { HttpPaymentService } from "@infrastructure/services/HttpPaymentService";
import { CreateOrderUseCase } from "@application/use-cases/CreateOrderUseCase";
import { OrderController } from "../interfaces/controllers/OrderController";
import { config } from "@main/config";

const orderRepository = new MongoOrderRepository();
const auditLogger = new MongoAuditLogger();
const paymentService = new HttpPaymentService(config.paymentServiceUrl);

const createOrderUseCase = new CreateOrderUseCase(
    orderRepository,
    paymentService,
    auditLogger
);

const orderController = new OrderController(createOrderUseCase);

export const container = {
    orderRepository,
    auditLogger,
    paymentService,
    createOrderUseCase,
    orderController,
};
