import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoTransactionRepository } from "@infrastructure/persistence/repositories/MongoTransactionRepository";
import { Transaction } from "@domain/entities/Transaction";
import { TransactionModel } from "@infrastructure/persistence/mongoose-models/TransactionModel";

let mongoServer: MongoMemoryServer;
let repo: MongoTransactionRepository;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    repo = new MongoTransactionRepository();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await TransactionModel.deleteMany({});
});

describe("MongoTransactionRepository", () => {
    describe("save", () => {
        it("should persist a transaction and return it with an id", async () => {
            const txn = new Transaction("", "c-1", "o-1", "p-1", 100, "success", new Date());
            const saved = await repo.save(txn);

            expect(saved.id).toBeDefined();
            expect(saved.id).not.toBe("");
            expect(saved.customerId).toBe("c-1");
            expect(saved.orderId).toBe("o-1");
            expect(saved.status).toBe("success");
        });

        it("should store the transaction in the database", async () => {
            await repo.save(new Transaction("", "c-1", "o-1", "p-1", 50, "success", new Date()));
            const count = await TransactionModel.countDocuments();
            expect(count).toBe(1);
        });
    });

    describe("findByOrderId", () => {
        it("should return a transaction by orderId", async () => {
            await repo.save(new Transaction("", "c-1", "order-abc", "p-1", 100, "success", new Date()));

            const found = await repo.findByOrderId("order-abc");

            expect(found).not.toBeNull();
            expect(found!.orderId).toBe("order-abc");
            expect(found!.customerId).toBe("c-1");
        });

        it("should return null when orderId not found", async () => {
            const found = await repo.findByOrderId("nonexistent");
            expect(found).toBeNull();
        });
    });
});
