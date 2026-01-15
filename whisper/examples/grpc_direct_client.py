import grpc
import sys
sys.path.append("../grpc_service")

import whisper_pb2
import whisper_pb2_grpc

def transcribe_audio(audio_file_path: str, grpc_host: str = "localhost:50051"):
    with open(audio_file_path, "rb") as f:
        audio_data = f.read()

    channel = grpc.insecure_channel(grpc_host)
    stub = whisper_pb2_grpc.WhisperServiceStub(channel)

    request = whisper_pb2.AudioRequest(
        audio_data=audio_data,
        task_id="test-task-123"
    )

    response = stub.Transcribe(request)

    print(f"Success: {response.success}")
    print(f"Task ID: {response.task_id}")
    print(f"Text: {response.text}")
    if response.error:
        print(f"Error: {response.error}")

    return response

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python grpc_direct_client.py <audio_file>")
        sys.exit(1)

    transcribe_audio(sys.argv[1])
