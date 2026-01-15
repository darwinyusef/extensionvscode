import pytest
import httpx
import asyncio
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

@pytest.mark.asyncio
async def test_health_check():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["redis"] == True

@pytest.mark.asyncio
async def test_sync_transcribe():
    audio_path = Path(__file__).parent / "fixtures" / "test.mp3"

    if not audio_path.exists():
        pytest.skip("Test audio file not found")

    async with httpx.AsyncClient(timeout=300.0) as client:
        with open(audio_path, "rb") as f:
            files = {"file": f}
            response = await client.post(f"{BASE_URL}/transcribe", files=files)

        assert response.status_code == 200
        data = response.json()
        assert "text" in data
        assert "task_id" in data
        assert data["success"] == True

@pytest.mark.asyncio
async def test_async_transcribe():
    audio_path = Path(__file__).parent / "fixtures" / "test.mp3"

    if not audio_path.exists():
        pytest.skip("Test audio file not found")

    async with httpx.AsyncClient() as client:
        with open(audio_path, "rb") as f:
            files = {"file": f}
            response = await client.post(f"{BASE_URL}/transcribe/async", files=files)

        assert response.status_code == 200
        data = response.json()
        assert "task_id" in data
        assert data["status"] == "processing"

        task_id = data["task_id"]
        await asyncio.sleep(5)

        status_response = await client.get(f"{BASE_URL}/task/{task_id}")
        assert status_response.status_code == 200

@pytest.mark.asyncio
async def test_invalid_format():
    async with httpx.AsyncClient() as client:
        files = {"file": ("test.txt", b"invalid audio data", "text/plain")}
        response = await client.post(f"{BASE_URL}/transcribe", files=files)
        assert response.status_code == 400

@pytest.mark.asyncio
async def test_metrics():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/metrics")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

@pytest.mark.asyncio
async def test_webhook_n8n():
    async with httpx.AsyncClient() as client:
        payload = {
            "audio_url": "https://example.com/test.mp3",
            "task_id": "test-webhook-123"
        }
        response = await client.post(f"{BASE_URL}/webhook/n8n", json=payload)

        if response.status_code == 200:
            data = response.json()
            assert "task_id" in data
            assert data["task_id"] == "test-webhook-123"
