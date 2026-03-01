import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import pinoHttp from "pino-http";
import { logger } from "@main/config";
import { orderRoutes } from "@main/routes";
import { setupSwagger } from "@main/swagger";

import axios from "axios";
import { config } from "@main/config";

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
    req.correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();
    res.setHeader("x-correlation-id", req.correlationId);
    next();
});

app.use(
    pinoHttp({
        logger,
        customProps: (req: any) => ({ correlationId: req.correlationId }),
    })
);

app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "UP" });
});

app.get("/ready", async (req: Request, res: Response) => {
    const checks: Record<string, boolean> = {
        mongodb: mongoose.connection.readyState === 1,
        paymentService: false,
    };

    try {
        await axios.get(`${config.paymentServiceUrl}/health`, {
            timeout: 2000,
        });
        checks.paymentService = true;
    } catch {
        checks.paymentService = false;
    }

    const allReady = Object.values(checks).every(Boolean);
    res.status(allReady ? 200 : 503).json({
        status: allReady ? "READY" : "UNAVAILABLE",
        dependencies: checks,
    });
});

// Mount routes with API versioning
app.use("/api/v1", orderRoutes);

// Swagger API documentation
setupSwagger(app);

export { app };
