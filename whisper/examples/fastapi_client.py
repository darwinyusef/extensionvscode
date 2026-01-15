import httpx
import asyncio
import json
from typing import Optional

class WhisperClient:
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url

    async def transcribe_sync(self, audio_file_path: str) -> dict:
        async with httpx.AsyncClient(timeout=300.0) as client:
            with open(audio_file_path, "rb") as f:
                files = {"file": f}
                response = await client.post(
                    f"{self.base_url}/transcribe",
                    files=files
                )
                return response.json()

    async def transcribe_async(self, audio_file_path: str) -> dict:
        async with httpx.AsyncClient() as client:
            with open(audio_file_path, "rb") as f:
                files = {"file": f}
                response = await client.post(
                    f"{self.base_url}/transcribe/async",
                    files=files
                )
                return response.json()

    async def stream_status(self, task_id: str):
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", f"{self.base_url}/stream/{task_id}") as response:
                async for line in response.aiter_lines():
                    if line.startswith("data:"):
                        data = json.loads(line[5:].strip())
                        yield data
                        if data.get("status") in ["completed", "failed"]:
                            break

    async def get_task_status(self, task_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/task/{task_id}")
            return response.json()

async def main():
    client = WhisperClient()

    result = await client.transcribe_async("test.mp3")
    print(f"Task ID: {result['task_id']}")

    async for status in client.stream_status(result['task_id']):
        print(f"Status: {status}")

if __name__ == "__main__":
    asyncio.run(main())
