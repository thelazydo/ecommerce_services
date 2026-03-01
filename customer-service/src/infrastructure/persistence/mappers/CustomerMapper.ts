import { Customer } from "@domain/entities/Customer";
import { ICustomerDocument } from "@infrastructure/persistence/mongoose-models/CustomerModel";

export class CustomerMapper {
    static toDomain(doc: ICustomerDocument): Customer {
        return new Customer(doc._id.toString(), doc.name, doc.email);
    }

    static toDocument(entity: Customer): Partial<ICustomerDocument> {
        return {
            name: entity.name,
            email: entity.email,
        };
    }
}
