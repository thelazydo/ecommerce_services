import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "@main/app";
import { CustomerModel } from "@infrastructure/persistence/mongoose-models/CustomerModel";
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
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

describe("Customer Service API", () => {
  describe("Health Checks", () => {
    it("should return 200 UP for /health", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "UP" });
    });

    it("should return 200 READY for /ready", async () => {
      const response = await request(app).get("/ready");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "READY" });
    });
  });

  describe("POST /api/v1/customers/seed", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).post("/api/v1/customers/seed");
      expect(response.status).toBe(401);
    });

    it("should seed the initial customer", async () => {
      const response = await request(app)
        .post("/api/v1/customers/seed")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe("John Doe");
      expect(response.body.email).toBe("john.doe@example.com");
    });

    it("should not create duplicates if seeded twice", async () => {
      await request(app)
        .post("/api/v1/customers/seed")
        .set("Authorization", `Bearer ${validToken}`);
      const response = await request(app)
        .post("/api/v1/customers/seed")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(201);

      const customers = await CustomerModel.find({});
      expect(customers.length).toBe(1);
    });
  });

  describe("GET /api/v1/customers/:id", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).get("/api/v1/customers/507f1f77bcf86cd799439011");
      expect(response.status).toBe(401);
    });

    it("should retrieve a customer by id", async () => {
      const seedResponse = await request(app)
        .post("/api/v1/customers/seed")
        .set("Authorization", `Bearer ${validToken}`);
      const customerId = seedResponse.body._id;

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(customerId);
      expect(response.body.name).toBe("John Doe");
      expect(response.body.email).toBe("john.doe@example.com");
    });

    it("should return 404 if customer not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/v1/customers/${fakeId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Customer not found");
    });

    it("should return 400 if id format is invalid", async () => {
      const response = await request(app)
        .get("/api/v1/customers/invalid-id")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation failed");
    });
  });
});
