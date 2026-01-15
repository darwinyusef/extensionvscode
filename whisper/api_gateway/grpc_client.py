import grpc
import os
import sys

sys.path.append(os.path.dirname(__file__))

# whisper protobuf imports http/2
import whisper_pb2

import whisper_pb2_grpc

class WhisperGRPCClient:
    def __init__(self):
        host = os.getenv("GRPC_HOST", "localhost")
        port = os.getenv("GRPC_PORT", "50051")
        self.channel = grpc.insecure_channel(f"{host}:{port}")
        self.stub = whisper_pb2_grpc.WhisperServiceStub(self.channel)

    # Transcribe audio data synchronously using gRPC
    def transcribe(self, audio_data: bytes, task_id: str = None) -> dict:
        request = whisper_pb2.AudioRequest(
            audio_data=audio_data,
            task_id=task_id or ""
        )
        response = self.stub.Transcribe(request)
        return {
            "text": response.text,
            "task_id": response.task_id,
            "success": response.success,
            "error": response.error
        }

    def transcribe_stream(self, audio_chunks, task_id: str = None):
        def request_generator():
            for idx, chunk in enumerate(audio_chunks):
                is_last = idx == len(audio_chunks) - 1
                yield whisper_pb2.AudioChunk(
                    data=chunk,
                    is_last=is_last,
                    task_id=task_id or ""
                )

        response = self.stub.TranscribeStream(request_generator())
        return {
            "text": response.text,
            "task_id": response.task_id,
            "success": response.success,
            "error": response.error
        }
