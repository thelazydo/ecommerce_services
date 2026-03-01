# ==========================================
# STAGE 1: The Builder
# ==========================================
FROM oven/bun:1.3.10 AS builder

WORKDIR /app

# 1. Copy package files first to cache the dependencies layer
COPY package.json bun.lock ./

# 2. Install dependencies
RUN bun install --frozen-lockfile

# 3. Copy the rest of the source code
COPY . .

# 4. Run typecheck and compile the standalone binary
RUN bun run build:bin

# ==========================================
# STAGE 2: The Production Runner
# ==========================================
FROM debian:bookworm-slim AS runner

WORKDIR /app

# 1. Set the environment to production
ENV NODE_ENV=production
# extra just for bun
ENV BUN_ENV=production
ENV PORT=3003

# 2. Copy the compiled binary from the builder stage
COPY --from=builder /app/dist/order_service ./order_service

# 3. Expose the port Customer Service API runs on
EXPOSE 3003

# 4. Execute the binary directly
CMD ["./order_service"]
