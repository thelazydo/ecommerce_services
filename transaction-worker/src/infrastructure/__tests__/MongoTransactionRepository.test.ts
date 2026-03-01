import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Transaction } from "@domain/entities/Transaction";
import { MongoTransactionRepository } from "@infrastructure/persistence/MongoTransactionRepository";
import { TransactionModel } from "@infrastructure/persistence/TransactionModel";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await TransactionModel.deleteMany({});
});

describe("MongoTransactionRepository", () => {
    let repository: MongoTransactionRepository;

    beforeEach(() => {
        repository = new MongoTransactionRepository();
    });

    it("should successfully save a transaction to the database", async () => {
        const transaction = new Transaction(
            "",
            "customer-1",
            "order-1",
            "product-1",
            150.5,
            "success",
            new Date(),
        );

        const savedTransaction = await repository.save(transaction);

        expect(savedTransaction.id).toBeDefined();
        expect(savedTransaction.id).not.toBe("");
        expect(savedTransaction.customerId).toBe("customer-1");
        expect(savedTransaction.orderId).toBe("order-1");
        expect(savedTransaction.productId).toBe("product-1");
        expect(savedTransaction.amount).toBe(150.5);
        expect(savedTransaction.status).toBe("success");
        expect(savedTransaction.createdAt).toBeDefined();

        const inDb = await TransactionModel.findById(savedTransaction.id);
        expect(inDb).toBeDefined();
        expect(inDb?.customerId).toBe("customer-1");
        expect(inDb?.amount).toBe(150.5);
    });
});
