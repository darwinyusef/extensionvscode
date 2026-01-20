@echo off
echo Creating network...
docker network create whisper_network 2>nul

echo Starting Whisper services...
cd /d "%~dp0"
docker-compose up -d --build

echo Starting n8n...
cd n8n
docker-compose up -d

cd ..

echo.
echo All services started:
echo - Whisper API: localhost:8001
echo - n8n: https://n8n.darwinyusef.com
echo - NATS: localhost:4222, localhost:8222
echo - gRPC: localhost:50051
echo - MinIO: https://minio.darwinyusef.com
echo - MinIO Console: https://console.darwinyusef.com

echo.
echo View logs:
echo   docker-compose logs -f              # Whisper
echo   cd n8n ^&^& docker-compose logs -f      # n8n
