services := "customer-service product-service order-service payment-service transaction-worker"

# Default recipe
default: setup build start

# Setup environment
setup:
    @for service in {{services}}; do \
        if [ ! -f "$service/.env" ] && [ -f .env.service.example ]; then cp .env.service.example "$service/.env"; fi; \
    done
    @if [ ! -f "./.env" ] && [ -f .env.example ]; then cp .env.example "./.env"; fi; \
    just install

# Install dependencies
install:
    for service in {{services}}; do \
        echo "Installing dependencies for $service..."; \
        (cd $service && bun install); \
    done

# Build services locally
build:
    for service in {{services}}; do \
        echo "Building $service..."; \
        (cd $service && bun run build); \
    done

# Start services with Docker Compose
start:
    docker-compose --env-file .env up --build -d

# Stop services
stop:
    docker-compose --env-file .env down

# Run all tests (fail fast)
test:
    for service in {{services}}; do \
        echo "Testing $service..."; \
        (cd $service && bun run test) || exit 1; \
    done

# Run tests for individual services
test-customer:
    cd customer-service && bun run test

test-product:
    cd product-service && bun run  test

test-order:
    cd order-service && bun run test

test-payment:
    cd payment-service && bun run test

# Run tests for worker
test-worker:
    cd transaction-worker && bun run test

# Validate AsyncAPI documentation
asyncapi:
    bunx @asyncapi/cli validate asyncapi.yaml

# Clean up artifacts
clean:
    for service in {{services}}; do \
        echo "Cleaning $service..."; \
        rm -rf $service/node_modules $service/dist; \
    done
    docker-compose --env-file .env down -v

# View logs
logs:
    docker-compose --env-file .env logs -f
