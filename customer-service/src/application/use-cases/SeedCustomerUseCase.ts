import { Customer } from "@domain/entities/Customer";
import { ICustomerRepository } from "@domain/repositories/ICustomerRepository";
import { IAuditLogger } from "@application/interfaces/IAuditLogger";
import {
    SeedCustomerRequest,
    SeedCustomerResponse,
} from "@application/dtos/SeedCustomerDTO";

const SEED_DATA = {
    name: "John Doe",
    email: "john.doe@example.com",
};

export class SeedCustomerUseCase {
    constructor(
        private readonly customerRepository: ICustomerRepository,
        private readonly auditLogger: IAuditLogger
    ) {}

    async execute(request: SeedCustomerRequest): Promise<SeedCustomerResponse> {
        let customer = await this.customerRepository.findByEmail(
            SEED_DATA.email
        );

        if (!customer) {
            customer = new Customer("", SEED_DATA.name, SEED_DATA.email);
            customer = await this.customerRepository.save(customer);
        }

        await this.auditLogger.log({
            action: "CUSTOMER_SEEDED",
            entityId: customer.id,
            entityType: "Customer",
            actorId: request.actorId,
            correlationId: request.correlationId,
        });

        return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
        };
    }
}
