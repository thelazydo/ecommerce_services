process.env.MONGODB_URI = "mongodb://localhost:27017/test-db";
process.env.RABBITMQ_URL = "amqp://localhost:5672";

import { logger } from "@main/config";
logger.level = "silent";
