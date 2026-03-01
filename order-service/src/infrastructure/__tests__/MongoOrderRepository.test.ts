import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoOrderRepository } from "@infrastructure/persistence/repositories/MongoOrderRepository";
import { Order } from "@domain/entities/Order";
import { OrderModel } from "@infrastructure/persistence/mongoose-models/OrderModel";

let mongoServer: MongoMemoryServer;
let repo: MongoOrderRepository;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    repo = new MongoOrderRepository();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await OrderModel.deleteMany({});
});

describe("MongoOrderRepository", () => {
    describe("save", () => {
        it("should persist an order and return it with an id", async () => {
            const order = new Order("", "c-1", "p-1", 100, "pending");
            const saved = await repo.save(order);

            expect(saved.id).toBeDefined();
            expect(saved.id).not.toBe("");
            expect(saved.customerId).toBe("c-1");
            expect(saved.orderStatus).toBe("pending");
        });
    });

    describe("findById", () => {
        it("should return an order when found", async () => {
            const saved = await repo.save(new Order("", "c-1", "p-1", 50, "pending"));
            const found = await repo.findById(saved.id);

            expect(found).not.toBeNull();
            expect(found!.amount).toBe(50);
        });

        it("should return null when not found", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            expect(await repo.findById(fakeId)).toBeNull();
        });
    });

    describe("update", () => {
        it("should update the order status", async () => {
            const saved = await repo.save(new Order("", "c-1", "p-1", 100, "pending"));
            const updated = await repo.update(
                new Order(saved.id, "c-1", "p-1", 100, "failed"),
            );

            expect(updated.orderStatus).toBe("failed");

            // Verify in DB
            const doc = await OrderModel.findById(saved.id);
            expect(doc!.orderStatus).toBe("failed");
        });

        it("should throw when order not found for update", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const order = new Order(fakeId, "c-1", "p-1", 100, "failed");

            await expect(repo.update(order)).rejects.toThrow(/not found for update/);
        });
    });
});
