import { Transaction } from "@domain/entities/Transaction";
import { ITransactionRepository } from "@domain/repositories/ITransactionRepository";
import { SaveTransactionRequest } from "@application/dtos/SaveTransactionDTO";
import { logger } from "@main/config";

export class SaveTransactionUseCase {
    constructor(
        private readonly transactionRepository: ITransactionRepository,
    ) { }

    async execute(request: SaveTransactionRequest): Promise<Transaction> {
        const transaction = new Transaction(
            "",
            request.customerId,
            request.orderId,
            request.productId,
            request.amount,
            "success",
            new Date(),
        );

        const saved = await this.transactionRepository.save(transaction);

        logger.info(
            {
                transactionId: saved.id,
                orderId: request.orderId,
                correlationId: request.correlationId,
            },
            "Transaction saved",
        );

        return saved;
    }
}
