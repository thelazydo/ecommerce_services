import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import pinoHttp from "pino-http";
import { config, logger } from "@main/config";
import { paymentRoutes } from "@main/routes";
import { container } from "@main/di-container";
import { setupSwagger } from "@main/swagger";

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  req.correlationId = req.headers["x-correlation-id"] as string;
  if (req.correlationId) {
    res.setHeader("x-correlation-id", req.correlationId);
  }
  next();
});

app.use(
  pinoHttp({
    logger,
    customProps: (req: any) => ({ correlationId: req.correlationId }),
  }),
);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "UP" });
});

app.get("/ready", (req: Request, res: Response) => {
  const checks: Record<string, boolean> = {
    mongodb: mongoose.connection.readyState === 1,
    rabbitmq: container.rabbitMQPublisher.isReady(),
  };

  const allReady = Object.values(checks).every(Boolean);
  res.status(allReady ? 200 : 503).json({
    status: allReady ? "READY" : "UNAVAILABLE",
    dependencies: checks,
  });
});

// Mount routes with API versioning
app.use("/api/v1", paymentRoutes);

// Swagger API documentation
setupSwagger(app);

async function connectRabbitMQ(): Promise<void> {
  const connectWithRetry = async (): Promise<void> => {
    try {
      await container.rabbitMQPublisher.connect(config.rabbitmqUrl);
    } catch (error) {
      logger.error({ err: error }, "Failed to connect to RabbitMQ");
      logger.info("Retrying RabbitMQ connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    }
  };

  await connectWithRetry();
}

async function closeRabbitMQ(): Promise<void> {
  await container.rabbitMQPublisher.close();
}

export { app, connectRabbitMQ, closeRabbitMQ };
