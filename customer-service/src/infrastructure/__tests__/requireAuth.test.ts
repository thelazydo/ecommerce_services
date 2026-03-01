import { createRequireAuth } from "@infrastructure/web/middleware/requireAuth";
import jwt from "jsonwebtoken";

const JWT_SECRET = "fallback-secret-for-tests";
const requireAuth = createRequireAuth(JWT_SECRET);

function createMockReqResNext() {
    const req: any = {
        headers: {},
        log: { warn: jest.fn() },
    };
    const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    return { req, res, next };
}

describe("requireAuth Middleware", () => {
    it("should return 401 when no Authorization header", () => {
        const { req, res, next } = createMockReqResNext();

        requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining("Unauthorized"),
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when Authorization header has wrong format", () => {
        const { req, res, next } = createMockReqResNext();
        req.headers.authorization = "Basic abc123";

        requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when token is invalid", () => {
        const { req, res, next } = createMockReqResNext();
        req.headers.authorization = "Bearer invalid.token.here";

        requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when token is expired", () => {
        const { req, res, next } = createMockReqResNext();
        const expiredToken = jwt.sign({ sub: "user" }, JWT_SECRET, {
            expiresIn: -10,
        });
        req.headers.authorization = `Bearer ${expiredToken}`;

        requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next() with valid token", () => {
        const { req, res, next } = createMockReqResNext();
        const validToken = jwt.sign({ sub: "user" }, JWT_SECRET);
        req.headers.authorization = `Bearer ${validToken}`;

        requireAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
