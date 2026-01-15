import asyncio
import httpx
import json
from pathlib import Path
from typing import Optional, Callable
import argparse

class WhisperFullClient:
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url

    async def transcribe_sync(self, audio_file: str) -> dict:
        async with httpx.AsyncClient(timeout=300.0) as client:
            with open(audio_file, "rb") as f:
                files = {"file": (Path(audio_file).name, f)}
                response = await client.post(f"{self.base_url}/transcribe", files=files)
                response.raise_for_status()
                return response.json()

    async def transcribe_async(
        self,
        audio_file: str,
        on_status: Optional[Callable[[dict], None]] = None
    ) -> dict:
        async with httpx.AsyncClient() as client:
            with open(audio_file, "rb") as f:
                files = {"file": (Path(audio_file).name, f)}
                response = await client.post(f"{self.base_url}/transcribe/async", files=files)
                response.raise_for_status()
                result = response.json()

            task_id = result["task_id"]

            if on_status:
                async for status in self.stream_status(task_id):
                    on_status(status)
                    if status.get("status") in ["completed", "failed"]:
                        return status

            return await self.get_task_status(task_id)

    async def stream_status(self, task_id: str):
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", f"{self.base_url}/stream/{task_id}") as response:
                async for line in response.aiter_lines():
                    if line.startswith("data:"):
                        try:
                            data = json.loads(line[5:].strip())
                            yield data
                        except json.JSONDecodeError:
                            continue

    async def get_task_status(self, task_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/task/{task_id}")
            response.raise_for_status()
            return response.json()

    async def health_check(self) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/health")
            return response.json()

    async def get_metrics(self) -> list:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/metrics")
            return response.json()

    async def webhook_n8n(
        self,
        audio_url: str,
        task_id: Optional[str] = None,
        callback_url: Optional[str] = None
    ) -> dict:
        async with httpx.AsyncClient() as client:
            payload = {"audio_url": audio_url}
            if task_id:
                payload["task_id"] = task_id
            if callback_url:
                payload["callback_url"] = callback_url

            response = await client.post(f"{self.base_url}/webhook/n8n", json=payload)
            response.raise_for_status()
            return response.json()

async def main():
    parser = argparse.ArgumentParser(description="Whisper API Client")
    parser.add_argument("audio_file", help="Path to audio file")
    parser.add_argument("--base-url", default="http://localhost:8001", help="API base URL")
    parser.add_argument("--async", dest="async_mode", action="store_true", help="Use async mode")
    parser.add_argument("--stream", action="store_true", help="Stream status updates")
    args = parser.parse_args()

    client = WhisperFullClient(args.base_url)

    health = await client.health_check()
    print(f"Health: {health}")

    if args.async_mode or args.stream:
        print(f"\nTranscribing (async): {args.audio_file}")

        def on_status(status):
            print(f"Status: {status.get('status')} - {status.get('text', '')[:50]}")

        result = await client.transcribe_async(
            args.audio_file,
            on_status=on_status if args.stream else None
        )
    else:
        print(f"\nTranscribing (sync): {args.audio_file}")
        result = await client.transcribe_sync(args.audio_file)

    print("\nResult:")
    print(f"  Task ID: {result.get('task_id')}")
    print(f"  Success: {result.get('success')}")
    print(f"  Text: {result.get('text')}")
    print(f"  Language: {result.get('language', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(main())
