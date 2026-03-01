import { Transaction } from "@domain/entities/Transaction";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { TransactionModel } from "@infrastructure/persistence/mongoose-models/TransactionModel";
import { TransactionMapper } from "@infrastructure/persistence/mappers/TransactionMapper";

export class MongoTransactionRepository implements ITransactionRepository {
    async findByOrderId(orderId: string): Promise<Transaction | null> {
        const doc = await TransactionModel.findOne({ orderId });
        return doc ? TransactionMapper.toDomain(doc) : null;
    }

    async save(transaction: Transaction): Promise<Transaction> {
        const data = TransactionMapper.toDocument(transaction);
        const doc = new TransactionModel(data);
        const saved = await doc.save();
        return TransactionMapper.toDomain(saved);
    }
}
