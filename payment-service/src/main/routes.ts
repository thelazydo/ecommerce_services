import { Router } from "express";
import { createRequireAuth } from "@infrastructure/web/middleware/requireAuth";
import { container } from "@main/di-container";
import { config } from "@main/config";

const router = Router();
const requireAuth = createRequireAuth(config.jwtSecret);

router.post(
    "/payments",
    requireAuth,
    container.paymentController.processPayment
);

export { router as paymentRoutes };
