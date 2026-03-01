import { z } from "zod";
import pino from "pino";

const configSchema = z.object({
    MONGODB_URI: z.string().url(),
    RABBITMQ_URL: z.string().url(),
    LOG_LEVEL: z.string().default("info"),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(
        "❌ Invalid environment variables:",
        parsed.error.flatten().fieldErrors,
    );
    process.exit(1);
}

export const config = parsed.data;

export const logger = pino({
    level: config.LOG_LEVEL,
    redact: ["req.headers.authorization"],
});
