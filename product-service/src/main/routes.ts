import { Router } from "express";
import { createRequireAuth } from "@infrastructure/web/middleware/requireAuth";
import { container } from "@main/di-container";
import { config } from "@main/config";

const router = Router();
const requireAuth = createRequireAuth(config.jwtSecret);

router.post(
    "/products/seed",
    requireAuth,
    container.productController.seed,
);

router.get(
    "/products/:id",
    requireAuth,
    container.productController.getById,
);

export { router as productRoutes };
