import { Transaction } from "@domain/entities/Transaction";

export interface ITransactionRepository {
    save(transaction: Transaction): Promise<Transaction>;
}
