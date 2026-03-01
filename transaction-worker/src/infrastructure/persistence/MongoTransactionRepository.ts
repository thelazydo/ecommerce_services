import { Transaction } from "@domain/entities/Transaction";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { TransactionModel } from "@infrastructure/persistence/TransactionModel";

export class MongoTransactionRepository implements ITransactionRepository {
    async save(transaction: Transaction): Promise<Transaction> {
        const doc = new TransactionModel({
            customerId: transaction.customerId,
            orderId: transaction.orderId,
            productId: transaction.productId,
            amount: transaction.amount,
            status: transaction.status,
        });

        const saved = await doc.save();

        return new Transaction(
            saved._id.toString(),
            saved.customerId,
            saved.orderId,
            saved.productId,
            saved.amount,
            saved.status,
            saved.createdAt
        );
    }
}
