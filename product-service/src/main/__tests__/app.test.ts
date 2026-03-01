import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "@main/app";
import { ProductModel } from "@infrastructure/persistence/mongoose-models/ProductModel";
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

describe("Product Service API", () => {
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

  describe("POST /api/v1/products/seed", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).post("/api/v1/products/seed");
      expect(response.status).toBe(401);
    });

    it("should seed the initial product", async () => {
      const response = await request(app)
        .post("/api/v1/products/seed")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe("Awesome Gadget");
      expect(response.body.price).toBe(99.99);
      expect(response.body.description).toBe(
        "A really awesome gadget for all your needs",
      );
    });

    it("should not create duplicates if seeded twice", async () => {
      await request(app)
        .post("/api/v1/products/seed")
        .set("Authorization", `Bearer ${validToken}`);
      const response = await request(app)
        .post("/api/v1/products/seed")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(201);

      const products = await ProductModel.find({});
      expect(products.length).toBe(1);
    });
  });

  describe("GET /api/v1/products/:id", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).get("/api/v1/products/507f1f77bcf86cd799439011");
      expect(response.status).toBe(401);
    });

    it("should retrieve a product by id", async () => {
      const seedResponse = await request(app)
        .post("/api/v1/products/seed")
        .set("Authorization", `Bearer ${validToken}`);
      const productId = seedResponse.body._id;

      const response = await request(app)
        .get(`/api/v1/products/${productId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(productId);
      expect(response.body.name).toBe("Awesome Gadget");
      expect(response.body.price).toBe(99.99);
      expect(response.body.description).toBe(
        "A really awesome gadget for all your needs",
      );
    });

    it("should return 404 if product not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/v1/products/${fakeId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Product not found");
    });

    it("should return 400 if id format is invalid", async () => {
      const response = await request(app)
        .get("/api/v1/products/invalid-id")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation failed");
    });
  });
});
