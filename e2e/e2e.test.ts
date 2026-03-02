import axios, { AxiosInstance } from "axios";
import jwt from "jsonwebtoken";
import { MongoClient, Db } from "mongodb";
import { describe, it, afterAll, beforeAll, expect } from "bun:test";

/**
 * E2E Integration Test
 *
 * Prerequisites: all services running via `docker compose up -d --build`
 *
 * This test verifies the full order → payment → transaction flow:
 * 1. Seed a customer
 * 2. Seed a product
 * 3. Create an order (which calls payment-service internally)
 * 4. Verify the order was created
 * 5. Verify a transaction was saved by the worker
 */

const CUSTOMER_URL = process.env.CUSTOMER_URL || "http://localhost:3001";
const PRODUCT_URL = process.env.PRODUCT_URL || "http://localhost:3002";
const ORDER_URL = process.env.ORDER_URL || "http://localhost:3003";
const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/youverify";
const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-e2e-testing";

let client: MongoClient;
let db: Db;
let token: string;

function createClient(baseURL: string): AxiosInstance {
    return axios.create({
        baseURL,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
        validateStatus: () => true, // don't throw on non-2xx
    });
}

beforeAll(async () => {
    token = jwt.sign({ sub: "e2e-test-user", role: "admin" }, JWT_SECRET, {
        expiresIn: "1h",
    });

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
});

afterAll(async () => {
    if (client) await client.close();
});

describe("E2E: Order → Payment → Transaction Flow", () => {
    let customerId: string;
    let productId: string;
    const amount = 49.99;

    it("should wait for services to be healthy", async () => {
        const waitForHealth = async (url: string, name: string) => {
            for (let i = 0; i < 30; i++) {
                try {
                    const res = await axios.get(`${url}/health`, {
                        timeout: 2000,
                    });
                    if (res.status === 200) return;
                } catch {}
                await new Promise((r) => setTimeout(r, 2000));
            }
            throw new Error(`${name} not healthy after 60s`);
        };

        await Promise.all([
            waitForHealth(CUSTOMER_URL, "customer-service"),
            waitForHealth(PRODUCT_URL, "product-service"),
            waitForHealth(ORDER_URL, "order-service"),
        ]);
    }, 70000);

    it("should seed a customer", async () => {
        const api = createClient(CUSTOMER_URL);
        const res = await api.post("/api/v1/customers/seed");
        expect(res.status).toBeLessThan(300);
        customerId = res.data._id || res.data.id;
        expect(customerId).toBeDefined();
    });

    it("should seed a product", async () => {
        const api = createClient(PRODUCT_URL);
        const res = await api.post("/api/v1/products/seed");
        expect(res.status).toBeLessThan(300);
        productId = res.data._id || res.data.id;
        expect(productId).toBeDefined();
    });

    it("should create an order and trigger payment", async () => {
        const api = createClient(ORDER_URL);
        const res = await api.post("/api/v1/orders", {
            customerId,
            productId,
            amount,
        });

        expect(res.status).toBe(201);
        expect(res.data.orderStatus).toBeDefined();
    });

    it("should have a transaction saved by the worker (eventually)", async () => {
        // The worker consumes async from RabbitMQ — wait up to 15s
        let transaction = null;
        for (let i = 0; i < 15; i++) {
            transaction = await db.collection("transactions").findOne({
                customerId,
                productId,
            });
            if (transaction) break;
            await new Promise((r) => setTimeout(r, 1000));
        }

        expect(transaction).toBeTruthy();
        expect(transaction!.amount).toBe(amount);
        expect(transaction!.status).toBe("success");
    }, 20000);
});
