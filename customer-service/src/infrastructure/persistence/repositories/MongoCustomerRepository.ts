import { Customer } from "@domain/entities/Customer";
import { ICustomerRepository } from "@domain/repositories/ICustomerRepository";
import { CustomerModel } from "@infrastructure/persistence/mongoose-models/CustomerModel";
import { CustomerMapper } from "@infrastructure/persistence/mappers/CustomerMapper";

export class MongoCustomerRepository implements ICustomerRepository {
    async findById(id: string): Promise<Customer | null> {
        const doc = await CustomerModel.findById(id);
        return doc ? CustomerMapper.toDomain(doc) : null;
    }

    async findByEmail(email: string): Promise<Customer | null> {
        const doc = await CustomerModel.findOne({ email });
        return doc ? CustomerMapper.toDomain(doc) : null;
    }

    async save(customer: Customer): Promise<Customer> {
        const data = CustomerMapper.toDocument(customer);
        const doc = new CustomerModel(data);
        const saved = await doc.save();
        return CustomerMapper.toDomain(saved);
    }
}
