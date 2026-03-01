import { app } from "@main/app";
import { config, logger } from "@main/config";
import { container } from "@main/di-container";
import mongoose from "mongoose";

if (!config.mongodbUri) {
    logger.fatal("MONGODB_URI environment variable is missing. Exiting.");
    process.exit(1);
}

const connectWithRetry = () => {
    logger.info("MongoDB connection with retry");
    mongoose
        .connect(config.mongodbUri)
        .then(async () => {
            logger.info("Connected to MongoDB (Customer Service)");

            // Seed initial customer on startup
            try {
                await container.seedCustomerUseCase.execute({
                    actorId: "system",
                    correlationId: "startup-seed",
                });
                logger.info("Initial customer seeded");
            } catch (error) {
                logger.error({ err: error }, "Failed to seed initial customer");
            }

            const server = app.listen(config.port, () => {
                logger.info(`Customer Service running on port ${config.port}`);
            });

            const gracefulShutdown = () => {
                logger.info("Received kill signal, shutting down gracefully");
                server.close(() => {
                    logger.info("Closed out remaining HTTP connections");
                    mongoose.disconnect().then(() => {
                        logger.info("MongoDB connection closed");
                        process.exit(0);
                    });
                });
            };

            process.on("SIGTERM", gracefulShutdown);
            process.on("SIGINT", gracefulShutdown);
        })
        .catch((error) => {
            logger.error(
                { err: error },
                "MongoDB connection error (Customer Service)"
            );
            logger.info("Retrying MongoDB connection in 5 seconds...");
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();
