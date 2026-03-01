import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoCustomerRepository } from "@infrastructure/persistence/repositories/MongoCustomerRepository";
import { Customer } from "@domain/entities/Customer";
import { CustomerModel } from "@infrastructure/persistence/mongoose-models/CustomerModel";

let mongoServer: MongoMemoryServer;
let repo: MongoCustomerRepository;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    repo = new MongoCustomerRepository();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await CustomerModel.deleteMany({});
});

describe("MongoCustomerRepository", () => {
    describe("save", () => {
        it("should persist a customer and return it with an id", async () => {
            const customer = new Customer("", "Alice", "alice@example.com");
            const saved = await repo.save(customer);

            expect(saved.id).toBeDefined();
            expect(saved.id).not.toBe("");
            expect(saved.name).toBe("Alice");
            expect(saved.email).toBe("alice@example.com");
        });

        it("should store the customer in the database", async () => {
            const customer = new Customer("", "Bob", "bob@example.com");
            await repo.save(customer);

            const count = await CustomerModel.countDocuments();
            expect(count).toBe(1);
        });
    });

    describe("findById", () => {
        it("should return a customer when found", async () => {
            const customer = new Customer("", "Charlie", "charlie@example.com");
            const saved = await repo.save(customer);

            const found = await repo.findById(saved.id);

            expect(found).not.toBeNull();
            expect(found!.id).toBe(saved.id);
            expect(found!.name).toBe("Charlie");
        });

        it("should return null when not found", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const found = await repo.findById(fakeId);

            expect(found).toBeNull();
        });
    });

    describe("findByEmail", () => {
        it("should return a customer by email", async () => {
            await repo.save(new Customer("", "Diana", "diana@example.com"));

            const found = await repo.findByEmail("diana@example.com");

            expect(found).not.toBeNull();
            expect(found!.name).toBe("Diana");
        });

        it("should return null when email not found", async () => {
            const found = await repo.findByEmail("nobody@example.com");
            expect(found).toBeNull();
        });
    });
});
