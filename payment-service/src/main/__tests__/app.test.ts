import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "@main/app";
import { container } from "@main/di-container";
import { TransactionModel } from "@infrastructure/persistence/mongoose-models/TransactionModel";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-tests";
const validToken = jwt.sign({ sub: "test-user" }, JWT_SECRET);

let mongoServer: MongoMemoryServer;

// Mock the RabbitMQPublisher
jest.mock("@infrastructure/messaging/RabbitMQPublisher", () => {
    return {
        RabbitMQPublisher: jest.fn().mockImplementation(() => ({
            connect: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn(),
            isReady: jest.fn().mockReturnValue(true),
            startConsumer: jest.fn(),
            close: jest.fn().mockResolvedValue(undefined),
            getChannel: jest.fn().mockReturnValue({}),
        })),
    };
});

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});

describe("Payment Service API", () => {
    describe("Health Checks", () => {
        it("should return 200 UP for /health", async () => {
            const response = await request(app).get("/health");
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: "UP" });
        });
    });

    describe("POST /api/v1/payments", () => {
        const payload = {
            customerId: "cust-123",
            orderId: "order-456",
            productId: "prod-789",
            amount: 99.99,
        };

        it("should return 401 if not authenticated", async () => {
            const response = await request(app).post("/api/v1/payments");
            expect(response.status).toBe(401);
        });

        it("should return 400 if required fields are missing", async () => {
            const response = await request(app)
                .post("/api/v1/payments")
                .set("Authorization", `Bearer ${validToken}`)
                .send({ customerId: "cust-123" });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty(
                "error",
                "Missing required fields"
            );
        });

        it("should process payment and publish to queue", async () => {
            const response = await request(app)
                .post("/api/v1/payments")
                .set("Authorization", `Bearer ${validToken}`)
                .set("x-correlation-id", "test-correlation")
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe(
                "Payment processed and published"
            );
        });

        it("should be idempotent for same orderId", async () => {
            // Create a transaction directly
            const txn = new TransactionModel({
                customerId: payload.customerId,
                orderId: payload.orderId,
                productId: payload.productId,
                amount: payload.amount,
                status: "success",
            });
            await txn.save();

            const response = await request(app)
                .post("/api/v1/payments")
                .set("Authorization", `Bearer ${validToken}`)
                .set("x-correlation-id", "test-correlation")
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("idempotent", true);
        });

        it("should return 503 when RabbitMQ is not ready", async () => {
            const publisherMock = container.rabbitMQPublisher;
            (publisherMock.isReady as jest.Mock).mockReturnValueOnce(false);

            const uniquePayload = {
                ...payload,
                orderId: "unique-order-503",
            };

            const response = await request(app)
                .post("/api/v1/payments")
                .set("Authorization", `Bearer ${validToken}`)
                .set("x-correlation-id", "test-correlation")
                .send(uniquePayload);

            expect(response.status).toBe(503);
            expect(response.body).toHaveProperty(
                "error",
                "RabbitMQ channel not available"
            );
        });
    });
});
