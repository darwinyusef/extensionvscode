import pytest
import grpc
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent / "grpc_service"))

import whisper_pb2
import whisper_pb2_grpc

GRPC_HOST = "localhost:50051"

def test_grpc_connection():
    channel = grpc.insecure_channel(GRPC_HOST)
    try:
        grpc.channel_ready_future(channel).result(timeout=10)
        assert True
    except grpc.FutureTimeoutError:
        pytest.skip("gRPC server not available")
    finally:
        channel.close()

def test_transcribe():
    audio_path = Path(__file__).parent / "fixtures" / "test.mp3"

    if not audio_path.exists():
        pytest.skip("Test audio file not found")

    with open(audio_path, "rb") as f:
        audio_data = f.read()

    channel = grpc.insecure_channel(GRPC_HOST)
    stub = whisper_pb2_grpc.WhisperServiceStub(channel)

    request = whisper_pb2.AudioRequest(
        audio_data=audio_data,
        task_id="test-grpc-001"
    )

    try:
        response = stub.Transcribe(request, timeout=300)
        assert response.success == True
        assert len(response.text) > 0
        assert response.task_id == "test-grpc-001"
    finally:
        channel.close()

def test_transcribe_stream():
    audio_path = Path(__file__).parent / "fixtures" / "test.mp3"

    if not audio_path.exists():
        pytest.skip("Test audio file not found")

    with open(audio_path, "rb") as f:
        audio_data = f.read()

    chunk_size = 1024 * 64
    chunks = [audio_data[i:i+chunk_size] for i in range(0, len(audio_data), chunk_size)]

    channel = grpc.insecure_channel(GRPC_HOST)
    stub = whisper_pb2_grpc.WhisperServiceStub(channel)

    def request_generator():
        for idx, chunk in enumerate(chunks):
            is_last = idx == len(chunks) - 1
            yield whisper_pb2.AudioChunk(
                data=chunk,
                is_last=is_last,
                task_id="test-stream-001"
            )

    try:
        response = stub.TranscribeStream(request_generator(), timeout=300)
        assert response.success == True
        assert len(response.text) > 0
    finally:
        channel.close()
