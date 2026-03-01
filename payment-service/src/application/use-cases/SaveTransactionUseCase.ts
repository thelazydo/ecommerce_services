import { Transaction } from "@domain/entities/Transaction";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { IAuditLogger } from "@application/interfaces/IAuditLogger";
import { SaveTransactionRequest } from "@application/dtos/SaveTransactionDTO";

export class SaveTransactionUseCase {
    constructor(
        private readonly transactionRepository: ITransactionRepository,
        private readonly auditLogger: IAuditLogger
    ) {}

    async execute(request: SaveTransactionRequest): Promise<Transaction> {
        const transaction = new Transaction(
            "",
            request.customerId,
            request.orderId,
            request.productId,
            request.amount,
            "success",
            new Date()
        );

        const saved = await this.transactionRepository.save(transaction);

        await this.auditLogger.log({
            action: "PAYMENT_PROCESSED",
            entityId: saved.id,
            entityType: "Transaction",
            actorId: "system",
            correlationId: request.correlationId,
        });

        return saved;
    }
}
