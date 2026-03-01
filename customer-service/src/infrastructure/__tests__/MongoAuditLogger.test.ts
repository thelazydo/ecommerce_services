import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoAuditLogger } from "@infrastructure/services/MongoAuditLogger";
import { AuditLogModel } from "@infrastructure/persistence/mongoose-models/AuditLogModel";
import pino from "pino";

let mongoServer: MongoMemoryServer;
let auditLogger: MongoAuditLogger;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    auditLogger = new MongoAuditLogger(pino({ level: "silent" }));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await AuditLogModel.deleteMany({});
});

describe("MongoAuditLogger", () => {
    it("should write an audit log document to the database", async () => {
        await auditLogger.log({
            action: "TEST_ACTION",
            entityId: "entity-1",
            entityType: "TestEntity",
            actorId: "actor-1",
            correlationId: "corr-1",
        });

        const logs = await AuditLogModel.find({});
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe("TEST_ACTION");
        expect(logs[0].entityId).toBe("entity-1");
        expect(logs[0].actorId).toBe("actor-1");
        expect(logs[0].correlationId).toBe("corr-1");
    });

    it("should not throw when writing fails", async () => {
        // Disconnect to force an error
        await mongoose.disconnect();

        await expect(
            auditLogger.log({
                action: "FAIL_ACTION",
                entityId: "e-1",
                entityType: "X",
                actorId: "a-1",
                correlationId: "c-1",
            })
        ).resolves.not.toThrow();

        // Reconnect for cleanup
        await mongoose.connect(mongoServer.getUri());
    });
});
