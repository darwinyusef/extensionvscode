n8n Integration with Whisper

Structure:
  n8n/
    ├── docker-compose.n8n.yml  - n8n + Caddy standalone
    ├── Caddyfile               - Reverse proxy config
    ├── .env.n8n                - Environment variables
    └── workflows/              - Example workflows
        └── whisper-transcription.json

Setup Options:

1. Full Stack (Whisper + n8n + Caddy):
   start-full.bat
   or
   docker-compose -f docker-compose.full.yml up -d

2. Only n8n + Caddy (if Whisper already running):
   cd n8n
   docker network create whisper_network
   docker-compose -f docker-compose.n8n.yml up -d

3. Only Whisper (without n8n):
   start.bat
   or
   docker-compose up -d

Configuration:

1. Edit n8n/.env.n8n:
   - Set N8N_USER and N8N_PASSWORD
   - Update N8N_HOST if needed
   - Update WEBHOOK_URL if needed

2. DNS Setup:
   Point these domains to your server:
   - n8n.darwinyusef.com
   - whisper.darwinyusef.com (optional)

3. Import Workflow:
   - Login to n8n: https://n8n.darwinyusef.com
   - Import: n8n/workflows/whisper-transcription.json

Whisper API Endpoints for n8n:

1. Sync Transcription:
   POST http://api_gateway:8000/transcribe
   Content-Type: multipart/form-data
   Body: file=<audio_file>

2. Async Transcription:
   POST http://api_gateway:8000/transcribe/async
   Returns: { "task_id": "...", "stream_url": "..." }

3. Get Status:
   GET http://api_gateway:8000/task/{task_id}

4. Webhook (direct):
   POST http://api_gateway:8000/webhook/n8n
   Body: { "audio_url": "https://...", "callback_url": "..." }

Ports:
  5678 - n8n (via Caddy reverse proxy)
  80   - Caddy HTTP
  443  - Caddy HTTPS
  8000 - Whisper API Gateway
  50051 - Whisper gRPC

Security Notes:
  - n8n only listens on 127.0.0.1:5678 (not exposed directly)
  - Caddy handles HTTPS and certificates automatically
  - Basic auth enabled on n8n by default
  - Change credentials in .env.n8n before production
