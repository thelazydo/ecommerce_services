import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import pinoHttp from "pino-http";
import { logger } from "@main/config";
import { customerRoutes } from "@main/routes";
import { setupSwagger } from "@main/swagger";

const app = express();
app.use(express.json());

// Correlation ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    req.correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();
    res.setHeader("x-correlation-id", req.correlationId);
    next();
});

// Structured logging
app.use(
    pinoHttp({
        logger,
        customProps: (req: any) => ({ correlationId: req.correlationId }),
    })
);

// Health and Readiness Checks
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "UP" });
});

app.get("/ready", (req: Request, res: Response) => {
    if (mongoose.connection.readyState === 1) {
        res.status(200).json({ status: "READY" });
    } else {
        res.status(503).json({ status: "UNAVAILABLE" });
    }
});

// Mount routes with API versioning
app.use("/api/v1", customerRoutes);

// Swagger API documentation
setupSwagger(app);

export { app };
