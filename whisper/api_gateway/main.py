from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import json
import uuid
import os
import logging
from grpc_client import WhisperGRPCClient
from nats.aio.client import Client as NATS
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Whisper API Gateway",
    version="1.0.0",
    description="gRPC-based transcription service with NATS real-time updates"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

grpc_client = WhisperGRPCClient()
nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
nc = None

ALLOWED_FORMATS = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm", ".mp4"}

@app.on_event("startup")
async def startup():
    global nc
    nc = NATS()
    await nc.connect(nats_url)
    logger.info(f"Connected to NATS: {nats_url}")

@app.on_event("shutdown")
async def shutdown():
    if nc:
        await nc.close()

# recibe el audio file y lo enviamos a  transcribe gRPC client
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # obtiene file extension
    ext = os.path.splitext(file.filename)[1].lower()
    # verifica si la extension es permitida con base a un listado de extensiones permitidas
    if ext not in ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail=f"Format not supported. Allowed: {ALLOWED_FORMATS}")

    # lee el contenido del archivo
    audio_data = await file.read()
    # genera un task id unico
    task_id = str(uuid.uuid4())

    try:
        # se envia a transcribir
        result = grpc_client.transcribe(audio_data, task_id)
        return {
            "task_id": task_id,
            "text": result["text"],
            "success": result["success"],
            "filename": file.filename
        }
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe/async")
async def transcribe_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail=f"Format not supported")

    task_id = str(uuid.uuid4())
    audio_data = await file.read()

    background_tasks.add_task(process_transcription, audio_data, task_id, file.filename)

    return {
        "task_id": task_id,
        "status": "processing",
        "stream_url": f"/stream/{task_id}",
        "status_url": f"/task/{task_id}"
    }

async def process_transcription(audio_data: bytes, task_id: str, filename: str):
    try:
        result = grpc_client.transcribe(audio_data, task_id)
    except Exception as e:
        logger.error(f"Background transcription error: {e}")

@app.get("/stream/{task_id}")
async def stream_status(task_id: str):
    async def event_generator():
        sub = await nc.subscribe(f"whisper.task.{task_id}")

        try:
            timeout_counter = 0
            max_timeout = 300

            while timeout_counter < max_timeout:
                try:
                    msg = await asyncio.wait_for(sub.next_msg(), timeout=1.0)
                    data = json.loads(msg.data.decode())

                    yield {
                        "event": "status",
                        "data": json.dumps(data)
                    }

                    if data.get("status") in ["completed", "failed"]:
                        break

                except asyncio.TimeoutError:
                    timeout_counter += 1
                    continue

            if timeout_counter >= max_timeout:
                yield {
                    "event": "timeout",
                    "data": json.dumps({"error": "Stream timeout"})
                }

        finally:
            await sub.unsubscribe()

    return EventSourceResponse(event_generator())

@app.post("/webhook/n8n")
async def webhook_n8n(data: dict, background_tasks: BackgroundTasks):
    audio_url = data.get("audio_url")
    task_id = data.get("task_id", str(uuid.uuid4()))
    callback_url = data.get("callback_url")

    if not audio_url:
        raise HTTPException(status_code=400, detail="audio_url required")

    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get(audio_url)
        audio_data = response.content

    background_tasks.add_task(
        process_transcription_with_callback,
        audio_data,
        task_id,
        os.path.basename(audio_url),
        callback_url
    )

    return {
        "task_id": task_id,
        "status": "processing",
        "stream_url": f"/stream/{task_id}"
    }

async def process_transcription_with_callback(
    audio_data: bytes,
    task_id: str,
    filename: str,
    callback_url: str = None
):
    try:
        result = grpc_client.transcribe(audio_data, task_id)
        response_data = {
            "task_id": task_id,
            "text": result["text"],
            "filename": filename,
            "success": True
        }

        if callback_url:
            import httpx
            async with httpx.AsyncClient() as client:
                await client.post(callback_url, json=response_data)

    except Exception as e:
        logger.error(f"Callback transcription error: {e}")

@app.get("/health")
async def health_check():
    try:
        nats_status = "connected" if nc and nc.is_connected else "disconnected"
        grpc_status = "connected"
    except Exception as e:
        return {
            "status": "unhealthy",
            "nats": "disconnected",
            "grpc": "unknown",
            "error": str(e)
        }

    return {
        "status": "healthy",
        "nats": nats_status,
        "grpc": grpc_status,
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "service": "Whisper API Gateway",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
