import { Customer } from "@domain/entities/Customer";
import { ICustomerRepository } from "@domain/repositories/ICustomerRepository";
import { CustomerNotFoundError } from "@domain/errors/CustomerNotFoundError";
import {
    GetCustomerRequest,
    GetCustomerResponse,
} from "@application/dtos/GetCustomerDTO";

export class GetCustomerUseCase {
    constructor(private readonly customerRepository: ICustomerRepository) {}

    async execute(request: GetCustomerRequest): Promise<GetCustomerResponse> {
        const customer = await this.customerRepository.findById(request.id);

        if (!customer) {
            throw new CustomerNotFoundError(request.id);
        }

        return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
        };
    }
}
