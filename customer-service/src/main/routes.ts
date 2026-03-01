import { Router } from "express";
import { createRequireAuth } from "@infrastructure/web/middleware/requireAuth";
import { container } from "@main/di-container";
import { config } from "@main/config";

const router = Router();
const requireAuth = createRequireAuth(config.jwtSecret);

router.post(
    "/customers/seed",
    requireAuth,
    container.customerController.seed,
);

router.get(
    "/customers/:id",
    requireAuth,
    container.customerController.getById,
);

export { router as customerRoutes };
