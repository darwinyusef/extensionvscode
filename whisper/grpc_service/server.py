import grpc
from concurrent import futures
import whisper
import whisper_pb2
import whisper_pb2_grpc
import os
import uuid
import json
import logging
import tempfile
import traceback
import asyncio
from nats.aio.client import Client as NATS

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WhisperServicer(whisper_pb2_grpc.WhisperServiceServicer):
    def __init__(self):
        model_size = os.getenv("MODEL_SIZE", "tiny")
        logger.info(f"Loading Whisper model: {model_size}")

        self.model = whisper.load_model(model_size, download_root="/models")
        self.nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
        self.nc = None

        logger.info(f"Whisper model '{model_size}' loaded successfully")
        self._connect_nats()

    def _connect_nats(self):
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            self.nc = NATS()
            loop.run_until_complete(self.nc.connect(self.nats_url))
            logger.info(f"NATS connected: {self.nats_url}")
        except Exception as e:
            logger.error(f"NATS connection error: {e}")

    def Transcribe(self, request, context):
        task_id = request.task_id or str(uuid.uuid4())
        temp_file = None

        try:
            self._publish_status(task_id, "processing", "Transcription started")

            with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as f:
                temp_file = f.name
                f.write(request.audio_data)

            logger.info(f"Task {task_id}: Transcribing audio ({len(request.audio_data)} bytes)")

            result = self.model.transcribe(
                temp_file,
                fp16=False,
                language=None
            )
            text = result["text"].strip()
            language = result.get("language", "unknown")

            logger.info(f"Task {task_id}: Completed. Language: {language}, Length: {len(text)} chars")

            self._publish_status(task_id, "completed", text, language=language)

            return whisper_pb2.TextResponse(
                text=text,
                task_id=task_id,
                success=True,
                error=""
            )

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Task {task_id}: Error - {error_msg}")
            logger.error(traceback.format_exc())

            self._publish_status(task_id, "failed", error=error_msg)

            return whisper_pb2.TextResponse(
                text="",
                task_id=task_id,
                success=False,
                error=error_msg
            )

        finally:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception as e:
                    logger.warning(f"Could not remove temp file: {e}")

    def TranscribeStream(self, request_iterator, context):
        task_id = str(uuid.uuid4())
        temp_file = None

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as f:
                temp_file = f.name
                total_bytes = 0

                for chunk in request_iterator:
                    f.write(chunk.data)
                    total_bytes += len(chunk.data)
                    if chunk.task_id:
                        task_id = chunk.task_id

            logger.info(f"Task {task_id}: Stream completed ({total_bytes} bytes)")

            self._publish_status(task_id, "processing", "Processing stream")

            result = self.model.transcribe(temp_file, fp16=False)
            text = result["text"].strip()
            language = result.get("language", "unknown")

            self._publish_status(task_id, "completed", text, language=language)

            return whisper_pb2.TextResponse(
                text=text,
                task_id=task_id,
                success=True
            )

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Stream task {task_id}: Error - {error_msg}")
            self._publish_status(task_id, "failed", error=error_msg)

            return whisper_pb2.TextResponse(
                text="",
                task_id=task_id,
                success=False,
                error=error_msg
            )

        finally:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception as e:
                    logger.warning(f"Could not remove temp file: {e}")

    def _publish_status(self, task_id, status, text="", error="", language=None):
        message = {
            "task_id": task_id,
            "status": status,
            "text": text,
            "error": error,
            "language": language
        }

        if self.nc and self.nc.is_connected:
            try:
                loop = asyncio.get_event_loop()
                loop.run_until_complete(
                    self.nc.publish(
                        f"whisper.task.{task_id}",
                        json.dumps(message).encode()
                    )
                )
            except Exception as e:
                logger.error(f"NATS publish error: {e}")

def serve():
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        options=[
            ('grpc.max_send_message_length', 100 * 1024 * 1024),
            ('grpc.max_receive_message_length', 100 * 1024 * 1024),
        ]
    )

    whisper_pb2_grpc.add_WhisperServiceServicer_to_server(
        WhisperServicer(),
        server
    )

    server.add_insecure_port('[::]:50051')
    logger.info("=" * 50)
    logger.info("Whisper gRPC Server")
    logger.info("Listening on port 50051")
    logger.info("=" * 50)

    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
