import pino from "pino";
import { z } from "zod";

const isTest = process.env.NODE_ENV === "test";

const configSchema = z.object({
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: isTest
    ? z.string().default("")
    : z.string({ message: "MONGODB_URI is required" }),
  JWT_SECRET: z.string().default("fallback-secret-for-tests"),
  ENCRYPTION_KEY: z
    .string()
    .min(32)
    .default("0123456789abcdef0123456789abcdef"),
  LOG_LEVEL: z.string().default("info"),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.log({ error: JSON.parse(parsed.error.message) });
  console.error("❌ Invalid environment configuration:");
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const config = {
  port: parsed.data.PORT,
  mongodbUri: parsed.data.MONGODB_URI,
  jwtSecret: parsed.data.JWT_SECRET,
  encryptionKey: parsed.data.ENCRYPTION_KEY,
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
logger.info(config);
