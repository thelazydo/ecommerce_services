import mongoose from "mongoose";
import amqp, { ConsumeMessage } from "amqplib";
import { config, logger } from "@main/config";
import { MongoTransactionRepository } from "@infrastructure/persistence/MongoTransactionRepository";
import { SaveTransactionUseCase } from "@application/use-cases/SaveTransactionUseCase";

const QUEUE_NAME = "payment.processed";

const repository = new MongoTransactionRepository();
const saveTransactionUseCase = new SaveTransactionUseCase(repository);

async function connectMongo(): Promise<void> {
    const connectWithRetry = async (): Promise<void> => {
        try {
            await mongoose.connect(config.MONGODB_URI);
            logger.info("Connected to MongoDB");
        } catch (error) {
            logger.error(
                { err: error },
                "MongoDB connection failed, retrying in 5s..."
            );
            setTimeout(connectWithRetry, 5000);
        }
    };
    await connectWithRetry();
}

async function startConsumer(): Promise<void> {
    let connection: any;
    let channel: any;

    const connectWithRetry = async (): Promise<void> => {
        try {
            connection = await amqp.connect(config.RABBITMQ_URL);
            channel = await connection.createChannel();

            // Ensure DLQ infrastructure exists
            await channel.assertExchange("payment.dlx", "direct", {
                durable: true,
            });
            await channel.assertQueue("payment.dlq", { durable: true });
            await channel.bindQueue("payment.dlq", "payment.dlx", QUEUE_NAME);

            await channel.assertQueue(QUEUE_NAME, {
                deadLetterExchange: "payment.dlx",
                deadLetterRoutingKey: QUEUE_NAME,
            });

            logger.info(
                `Worker is listening for messages on "${QUEUE_NAME}" queue...`
            );

            channel.consume(QUEUE_NAME, async (msg: ConsumeMessage | null) => {
                if (msg === null) return;

                let data: any;
                try {
                    data = JSON.parse(msg.content.toString());

                    logger.info(
                        {
                            transactionData: data,
                            correlationId: data.correlationId,
                        },
                        "Worker received transaction data"
                    );

                    await saveTransactionUseCase.execute({
                        customerId: data.customerId,
                        orderId: data.orderId,
                        productId: data.productId,
                        amount: data.amount,
                        correlationId: data.correlationId,
                    });

                    channel.ack(msg);
                } catch (error: any) {
                    logger.error(
                        { err: error, correlationId: data?.correlationId },
                        "Worker failed to process message, routing to DLQ"
                    );
                    channel.nack(msg, false, false);
                }
            });
        } catch (error) {
            logger.error(
                { err: error },
                "RabbitMQ connection failed, retrying in 5s..."
            );
            setTimeout(connectWithRetry, 5000);
        }
    };

    await connectWithRetry();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        logger.info(`${signal} received — shutting down worker`);
        try {
            if (channel) await channel.close();
            if (connection) await connection.close();
        } catch {}
        await mongoose.disconnect();
        process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

async function main(): Promise<void> {
    await connectMongo();
    await startConsumer();
}

main().catch((error) => {
    logger.error({ err: error }, "Transaction worker failed to start");
    process.exit(1);
});
