import { MongoCustomerRepository } from "@infrastructure/persistence/repositories/MongoCustomerRepository";
import { MongoAuditLogger } from "@infrastructure/services/MongoAuditLogger";
import { SeedCustomerUseCase } from "@application/use-cases/SeedCustomerUseCase";
import { GetCustomerUseCase } from "@application/use-cases/GetCustomerUseCase";
import { CustomerController } from "../interfaces/controllers/CustomerController";
import { logger } from "@main/config";

const customerRepository = new MongoCustomerRepository();
const auditLogger = new MongoAuditLogger(logger);

const seedCustomerUseCase = new SeedCustomerUseCase(
    customerRepository,
    auditLogger
);
const getCustomerUseCase = new GetCustomerUseCase(customerRepository);

const customerController = new CustomerController(
    seedCustomerUseCase,
    getCustomerUseCase
);

export const container = {
    customerRepository,
    auditLogger,
    seedCustomerUseCase,
    getCustomerUseCase,
    customerController,
};
