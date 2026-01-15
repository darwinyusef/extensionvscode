#!/bin/bash

echo "Testing Whisper Microservice"
echo "=============================="

echo "\n1. Health Check"
curl -X GET http://localhost:8001/health

echo "\n\n2. Sync Transcription"
curl -X POST http://localhost:8001/transcribe \
  -F "file=@test.mp3" \
  -H "Content-Type: multipart/form-data"

echo "\n\n3. Async Transcription"
RESPONSE=$(curl -s -X POST http://localhost:8001/transcribe/async \
  -F "file=@test.mp3")
echo $RESPONSE

TASK_ID=$(echo $RESPONSE | jq -r '.task_id')
echo "\nTask ID: $TASK_ID"

echo "\n4. Stream Status (SSE)"
curl -N http://localhost:8001/stream/$TASK_ID

echo "\n\n5. Get Task Status"
curl -X GET http://localhost:8001/task/$TASK_ID

echo "\n\n6. N8N Webhook"
curl -X POST http://localhost:8001/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio.mp3",
    "task_id": "custom-task-id"
  }'
