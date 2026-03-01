import { Transaction } from "@domain/entities/Transaction";
import { ITransactionDocument } from "@infrastructure/persistence/mongoose-models/TransactionModel";

export class TransactionMapper {
    static toDomain(doc: ITransactionDocument): Transaction {
        return new Transaction(
            doc._id.toString(),
            doc.customerId,
            doc.orderId,
            doc.productId,
            doc.amount,
            doc.status,
            doc.createdAt,
        );
    }

    static toDocument(entity: Transaction): Partial<ITransactionDocument> {
        return {
            customerId: entity.customerId,
            orderId: entity.orderId,
            productId: entity.productId,
            amount: entity.amount,
            status: entity.status,
        };
    }
}
