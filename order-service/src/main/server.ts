import { app } from "@main/app";
import { config, logger } from "@main/config";
import mongoose from "mongoose";

if (!config.mongodbUri || !config.paymentServiceUrl) {
    logger.fatal(
        "MONGODB_URI or PAYMENT_SERVICE_URL environment variable is missing. Exiting."
    );
    process.exit(1);
}

const connectWithRetry = () => {
    logger.info("MongoDB connection with retry");
    mongoose
        .connect(config.mongodbUri!, {
            writeConcern: { w: "majority", j: true },
        })
        .then(() => {
            logger.info("Connected to MongoDB (Order Service)");

            const server = app.listen(config.port, () => {
                logger.info(`Order Service running on port ${config.port}`);
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
                "MongoDB connection error (Order Service)"
            );
            logger.info("Retrying MongoDB connection in 5 seconds...");
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();
