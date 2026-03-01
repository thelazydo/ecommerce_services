SERVICES := customer-service product-service order-service payment-service transaction-worker

.PHONY: all setup install build start stop test clean logs \
        test-customer test-product test-order test-payment test-worker \
        asyncapi

all: setup build start

setup:
	@echo "Setting up environment..."
	@for service in $(SERVICES); do \
		if [ ! -f "$$service/.env" ] && [ -f .env.service.example ]; then cp .env.service.example "$$service/.env"; fi; \
	done
	@if [ ! -f "$$service/.env" ] && [ -f .env.example ]; then cp .env.example "$$service/.env"; fi; \
	make install

install:
	@echo "Installing dependencies..."
	@for service in $(SERVICES); do \
		echo "Installing dependencies for $$service..."; \
		(cd $$service && bun install); \
	done

build:
	@echo "Building services..."
	@for service in $(SERVICES); do \
		echo "Building $$service..."; \
		(cd $$service && bun run build); \
	done

start:
	@echo "Starting services with Docker Compose..."
	docker-compose --env-file .env up --build -d

stop:
	@echo "Stopping services..."
	docker-compose --env-file .env down

test:
	@echo "Running all tests..."
	@for service in $(SERVICES); do \
		echo "Testing $$service..."; \
		(cd $$service && bun run test) || exit 1; \
	done

test-customer:
	@echo "Testing customer-service..."
	@cd customer-service && bun run test

test-product:
	@echo "Testing product-service..."
	@cd product-service && bun run test

test-order:
	@echo "Testing order-service..."
	@cd order-service && bun run test

test-payment:
	@echo "Testing payment-service..."
	@cd payment-service && bun run test

test-worker:
	@echo "Testing transaction-worker..."
	@cd transaction-worker && bun run test

clean:
	@echo "Cleaning up..."
	@for service in $(SERVICES); do \
		echo "Cleaning $$service..."; \
		rm -rf $$service/node_modules $$service/dist; \
	done
	docker-compose --env-file .env down -v

logs:
	docker-compose --env-file .env logs -f

asyncapi:
	@echo "Validating AsyncAPI document..."
	bunx @asyncapi/cli validate asyncapi.yaml
