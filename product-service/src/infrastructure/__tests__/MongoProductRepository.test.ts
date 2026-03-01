import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoProductRepository } from "@infrastructure/persistence/repositories/MongoProductRepository";
import { Product } from "@domain/entities/Product";
import { ProductModel } from "@infrastructure/persistence/mongoose-models/ProductModel";

let mongoServer: MongoMemoryServer;
let repo: MongoProductRepository;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    repo = new MongoProductRepository();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await ProductModel.deleteMany({});
});

describe("MongoProductRepository", () => {
    describe("save", () => {
        it("should persist a product and return it with an id", async () => {
            const product = new Product("", "Widget", 19.99, "desc");
            const saved = await repo.save(product);

            expect(saved.id).toBeDefined();
            expect(saved.id).not.toBe("");
            expect(saved.name).toBe("Widget");
            expect(saved.price).toBe(19.99);
        });
    });

    describe("findById", () => {
        it("should return a product when found", async () => {
            const saved = await repo.save(new Product("", "Gadget", 9.99));
            const found = await repo.findById(saved.id);

            expect(found).not.toBeNull();
            expect(found!.name).toBe("Gadget");
        });

        it("should return null when not found", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            expect(await repo.findById(fakeId)).toBeNull();
        });
    });

    describe("findByName", () => {
        it("should return a product by name", async () => {
            await repo.save(new Product("", "UniqueProduct", 49.99));
            const found = await repo.findByName("UniqueProduct");

            expect(found).not.toBeNull();
            expect(found!.price).toBe(49.99);
        });

        it("should return null when name not found", async () => {
            expect(await repo.findByName("NonExistent")).toBeNull();
        });
    });
});
