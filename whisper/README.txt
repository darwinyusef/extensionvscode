Whisper Microservice - gRPC + FastAPI + NATS

Architecture:
  - NATS: Messaging and pub/sub
  - gRPC: Whisper transcription service
  - FastAPI: REST API gateway + webhooks
  - n8n: Workflow automation (separate service)
  - Caddy: Reverse proxy + HTTPS (separate service)

Services Structure:
  docker-compose.yml       # Whisper (NATS + gRPC + API)
  n8n/docker-compose.yml   # n8n service
  caddy/docker-compose.yml # Caddy reverse proxy

Quick Start:

1. Solo Whisper:
   Windows: start.bat
   Linux:   make up

2. Todo (Whisper + n8n + Caddy):
   Windows: start-all.bat
   Linux:   make all

3. Parar todo:
   Windows: stop-all.bat
   Linux:   make stop-all

Individual Services:

Whisper:
  make up          # Start
  make down        # Stop
  make logs        # View logs

n8n:
  make n8n-up      # Start
  make n8n-down    # Stop
  make n8n-logs    # View logs

Caddy:
  make caddy-up    # Start
  make caddy-down  # Stop
  make caddy-logs  # View logs

Endpoints:
  http://localhost:8001/docs - API documentation
  http://localhost:8001/health - Health check
  http://localhost:4222 - NATS server
  http://localhost:8222 - NATS monitoring
  https://n8n.darwinyusef.com - n8n (via Caddy)
  https://whisper.darwinyusef.com - Whisper API (via Caddy)

Testing:
  Sync:  curl -X POST http://localhost:8001/transcribe -F "file=@audio.mp3"
  Async: curl -X POST http://localhost:8001/transcribe/async -F "file=@audio.mp3"

Python Client:
  python examples/full_client.py audio.mp3 --async --stream

gRPC Direct:
  python examples/grpc_direct_client.py audio.mp3

NATS Monitoring:
  python examples/nats_subscriber.py <task_id>

n8n Integration:
  POST /webhook/n8n
  Body: {"audio_url": "https://...", "callback_url": "https://..."}

Supported Formats:
  .mp3, .wav, .m4a, .ogg, .flac, .webm, .mp4

Environment Variables (.env file):
  MODEL_SIZE - tiny|base|small|medium|large (default: tiny)
  NATS_URL - NATS server URL
  GRPC_HOST - gRPC hostname
  GRPC_PORT - gRPC port
  N8N_USER - n8n username
  N8N_PASSWORD - n8n password
  N8N_HOST - n8n domain
  WEBHOOK_URL - n8n webhook URL

Ports:
  8001 - API Gateway (external)
  8000 - API Gateway (internal container)
  50051 - gRPC Service
  4222 - NATS Client
  8222 - NATS Monitoring
  5678 - n8n (internal, via Caddy)
  80 - Caddy HTTP
  443 - Caddy HTTPS

Configuration Files:
  .env.example - Copy to .env and configure
  docker-compose.yml - Whisper services
  n8n/docker-compose.yml - n8n service
  caddy/docker-compose.yml - Caddy reverse proxy
  caddy/Caddyfile - Reverse proxy configuration

Network:
  All services use shared network: whisper_network
  Created automatically by start scripts
  Manual: docker network create whisper_network

Integration with Other Projects:
  1. Copy docker-compose.yml services to your project
  2. Use whisper_network as external network
  3. Access API via http://whisper_api:8000 (internal)

Troubleshooting:
  make logs        # View Whisper logs
  make status      # Check service status
  make restart     # Restart Whisper services
  make health      # Health check
