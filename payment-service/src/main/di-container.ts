import { MongoTransactionRepository } from "@infrastructure/persistence/repositories/MongoTransactionRepository";
import { MongoAuditLogger } from "@infrastructure/services/MongoAuditLogger";
import { RabbitMQPublisher } from "@infrastructure/messaging/RabbitMQPublisher";
import { ProcessPaymentUseCase } from "@application/use-cases/ProcessPaymentUseCase";
import { SaveTransactionUseCase } from "@application/use-cases/SaveTransactionUseCase";
import { PaymentController } from "../interfaces/controllers/PaymentController";

const transactionRepository = new MongoTransactionRepository();
const auditLogger = new MongoAuditLogger();
const rabbitMQPublisher = new RabbitMQPublisher();

const processPaymentUseCase = new ProcessPaymentUseCase(
    transactionRepository,
    rabbitMQPublisher,
);

const saveTransactionUseCase = new SaveTransactionUseCase(
    transactionRepository,
    auditLogger,
);

const paymentController = new PaymentController(processPaymentUseCase);

export const container = {
    transactionRepository,
    auditLogger,
    rabbitMQPublisher,
    processPaymentUseCase,
    saveTransactionUseCase,
    paymentController,
};
