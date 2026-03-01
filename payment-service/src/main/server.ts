import { app, connectRabbitMQ, closeRabbitMQ } from "@main/app";
import { config, logger } from "@main/config";
import mongoose from "mongoose";

if (!config.mongodbUri || !config.rabbitmqUrl) {
    logger.fatal(
        "MONGODB_URI or RABBITMQ_URL environment variable is missing. Exiting.",
    );
    process.exit(1);
}

const connectWithRetry = () => {
    logger.info("MongoDB connection with retry");
    mongoose
        .connect(config.mongodbUri!, { writeConcern: { w: "majority", j: true } })
        .then(() => {
            logger.info("Connected to MongoDB (Payment Service)");
            const server = app.listen(config.port, () => {
                logger.info(`Payment Service running on port ${config.port}`);
                connectRabbitMQ();
            });

            const gracefulShutdown = () => {
                logger.info("Received kill signal, shutting down gracefully");
                server.close(async () => {
                    logger.info("Closed out remaining HTTP connections");
                    await closeRabbitMQ();
                    logger.info("RabbitMQ connection closed");
                    mongoose.disconnect().then(() => {
                        logger.info("MongoDB connection closed");
                        process.exit(0);
                    });
                });
            };

            process.on("SIGTERM", gracefulShutdown);
            process.on("SIGINT", gracefulShutdown);
        })
        .catch((error: any) => {
            logger.error(
                { err: error },
                "MongoDB connection error (Payment Service)",
            );
            logger.info("Retrying MongoDB connection in 5 seconds...");
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();
