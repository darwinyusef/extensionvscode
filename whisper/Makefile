.PHONY: build up down logs restart clean test proto install network

network:
	docker network create whisper_network 2>/dev/null || true

build: network
	docker-compose build

up: network
	docker-compose up -d
	@echo "Whisper services started:"
	@echo "  API Gateway: http://localhost:8001/docs"
	@echo "  gRPC: localhost:50051"
	@echo "  NATS: localhost:4222 (client), localhost:8222 (monitoring)"

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*_pb2.py" -delete
	find . -type f -name "*_pb2_grpc.py" -delete

test:
	docker-compose up -d
	sleep 10
	pytest tests/ -v
	docker-compose down

proto:
	cd grpc_service && python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. whisper.proto
	cd api_gateway && python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. whisper.proto

install:
	pip install grpcio-tools
	make proto

status:
	@echo "Service Status:"
	@docker-compose ps

health:
	@curl -s http://localhost:8001/health | python -m json.tool

# Start all services (Whisper + n8n + Caddy)
all: network
	docker-compose up -d
	cd n8n && docker-compose up -d
	cd caddy && docker-compose up -d
	@echo "All services started"
	@echo "  Whisper: http://localhost:8001"
	@echo "  n8n: https://n8n.darwinyusef.com"
	@echo "  Whisper Public: https://whisper.darwinyusef.com"

# Stop all services
stop-all:
	docker-compose down
	cd n8n && docker-compose down
	cd caddy && docker-compose down

# Logs for all services
logs-all:
	docker-compose logs -f &
	cd n8n && docker-compose logs -f &
	cd caddy && docker-compose logs -f

# Individual service management
n8n-up: network
	cd n8n && docker-compose up -d
	@echo "n8n started: https://n8n.darwinyusef.com"

n8n-down:
	cd n8n && docker-compose down

n8n-logs:
	cd n8n && docker-compose logs -f

caddy-up: network
	cd caddy && docker-compose up -d
	@echo "Caddy started"

caddy-down:
	cd caddy && docker-compose down

caddy-logs:
	cd caddy && docker-compose logs -f
