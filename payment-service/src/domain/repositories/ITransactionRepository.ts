import { Transaction } from "@domain/entities/Transaction";

export interface ITransactionRepository {
    findByOrderId(orderId: string): Promise<Transaction | null>;
    save(transaction: Transaction): Promise<Transaction>;
}
