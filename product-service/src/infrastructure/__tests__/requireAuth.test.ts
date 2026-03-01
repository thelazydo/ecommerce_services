import { createRequireAuth } from "@infrastructure/web/middleware/requireAuth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-tests";
const requireAuth = createRequireAuth(JWT_SECRET);

function createMocks() {
    const req: any = { headers: {}, log: { warn: jest.fn() } };
    const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    return { req, res, next };
}

describe("requireAuth Middleware", () => {
    it("should return 401 with no Authorization header", () => {
        const { req, res, next } = createMocks();
        requireAuth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 with invalid token", () => {
        const { req, res, next } = createMocks();
        req.headers.authorization = "Bearer bad.token";
        requireAuth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should call next() with valid token", () => {
        const { req, res, next } = createMocks();
        req.headers.authorization = `Bearer ${jwt.sign({ sub: "u" }, JWT_SECRET)}`;
        requireAuth(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
