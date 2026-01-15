@echo off
echo Creating network...
docker network create whisper_network 2>nul

echo Building and starting Whisper services...
docker-compose up -d --build

echo.
echo Whisper services started:
echo - NATS: localhost:4222 (client), localhost:8222 (monitoring)
echo - gRPC Service: localhost:50051
echo - API Gateway: localhost:8001

echo.
echo Endpoints:
echo - API Documentation: http://localhost:8001/docs
echo - Health Check: http://localhost:8001/health
echo - NATS Monitoring: http://localhost:8222

echo.
echo Logs: docker-compose logs -f
