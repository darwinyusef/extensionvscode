@echo off
echo Stopping all services...

cd /d "%~dp0"
docker-compose down

cd n8n
docker-compose down

cd ..

echo.
echo All services stopped.
echo To remove network: docker network rm whisper_network
