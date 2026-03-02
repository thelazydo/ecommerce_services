import pino from "pino";
import { z } from "zod";

const isTest = process.env.NODE_ENV === "test";

const configSchema = z.object({
    PORT: z.coerce.number().default(3003),
    MONGODB_URI: isTest
        ? z.string().default("")
        : z.string({ message: "MONGODB_URI is required" }),
    PAYMENT_SERVICE_URL: z.string().default("http://localhost:3004"),
    JWT_SECRET: z.string().default("fallback-secret-for-tests"),
    LOG_LEVEL: z.string().default("info"),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(z.treeifyError(parsed.error));
    process.exit(1);
}

export const config = {
    port: parsed.data.PORT,
    mongodbUri: parsed.data.MONGODB_URI,
    paymentServiceUrl: parsed.data.PAYMENT_SERVICE_URL,
    jwtSecret: parsed.data.JWT_SECRET,
    logLevel: parsed.data.LOG_LEVEL,
};

export const logger = pino({
    level: config.logLevel,
    redact: {
        paths: [
            "req.headers.authorization",
            "email",
            "name",
            "payload.email",
            "payload.name",
        ],
        censor: "[REDACTED]",
    },
});
