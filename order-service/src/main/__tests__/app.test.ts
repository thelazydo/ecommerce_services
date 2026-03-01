import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import nock from "nock";
import { app } from "@main/app";
import { OrderModel } from "@infrastructure/persistence/mongoose-models/OrderModel";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-tests";
const validToken = jwt.sign({ sub: "test-user" }, JWT_SECRET);

let mongoServer: MongoMemoryServer;

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
  nock.cleanAll();
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

describe("Order Service API", () => {
  const PAYMENT_SERVICE_URL =
    process.env.PAYMENT_SERVICE_URL || "http://localhost:3004";

  describe("Health Checks", () => {
    it("should return 200 UP for /health", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "UP" });
    });

    it("should return 200 READY for /ready", async () => {
      nock(PAYMENT_SERVICE_URL)
        .get("/health")
        .reply(200, { status: "UP" });

      const response = await request(app).get("/ready");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "READY", dependencies: { mongodb: true, paymentService: true } });
    });
  });

  describe("POST /api/v1/orders", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).post("/api/v1/orders");
      expect(response.status).toBe(401);
    });

    it("should create an order successfully when payment succeeds", async () => {
      const payload = {
        customerId: "cust-123",
        productId: "prod-456",
        amount: 99.99,
      };

      nock(PAYMENT_SERVICE_URL)
        .post("/api/v1/payments", (body) => {
          expect(body).toHaveProperty("customerId", payload.customerId);
          expect(body).toHaveProperty("productId", payload.productId);
          expect(body).toHaveProperty("amount", payload.amount);
          expect(body).toHaveProperty("orderId");
          return true;
        })
        .reply(200, { success: true });

      const response = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${validToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("orderId");
      expect(response.body.customerId).toBe(payload.customerId);
      expect(response.body.productId).toBe(payload.productId);
      expect(response.body.orderStatus).toBe("pending");

      const orders = await OrderModel.find({});
      expect(orders.length).toBe(1);
      expect(orders[0].customerId).toBe(payload.customerId);
      expect(orders[0].amount).toBe(payload.amount);
      expect(orders[0].orderStatus).toBe("pending");
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          customerId: "cust-123",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    it("should return 502 if payment service fails", async () => {
      const payload = {
        customerId: "cust-123",
        productId: "prod-456",
        amount: 99.99,
      };

      nock(PAYMENT_SERVICE_URL)
        .post("/api/v1/payments")
        .reply(500, { error: "Internal Server Error" });

      const response = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${validToken}`)
        .send(payload);

      expect(response.status).toBe(502);
      expect(response.body).toHaveProperty(
        "error",
        "Payment service failed to process the request",
      );

      const orders = await OrderModel.find({});
      expect(orders.length).toBe(1);
      expect(orders[0].orderStatus).toBe("failed");
    });

    it("should return 502 if payment service returns an unexpected status", async () => {
      const payload = {
        customerId: "cust-123",
        productId: "prod-456",
        amount: 99.99,
      };

      nock(PAYMENT_SERVICE_URL)
        .post("/api/v1/payments")
        .reply(400, { error: "Bad Request" });

      const response = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${validToken}`)
        .send(payload);

      expect(response.status).toBe(502);
      expect(response.body).toHaveProperty(
        "error",
        "Payment service failed to process the request",
      );

      const orders = await OrderModel.find({});
      expect(orders.length).toBe(1);
      expect(orders[0].orderStatus).toBe("failed");
    });
  });
});
